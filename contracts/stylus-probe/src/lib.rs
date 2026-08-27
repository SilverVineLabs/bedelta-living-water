//! SliverVineSoilCoprocessor — on-chain fixed-point soil resistance coprocessor.
//! SPDX-License-Identifier: BUSL-1.1
//!
//! Fixed-point score (u128 intermediates, u64 result):
//!   base = spread×100 + slippage×120 + (MIN_DEPTH×10_000 / depth_usd)
//!   + quadratic(excess_spread) when spread > 50 bps
//!   + quadratic(excess_slippage) when slippage > 25 bps
//! Fail-closed when depth < 10_000 USD or score > 10_000.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::prelude::*;

const MAX_SPREAD_BPS: u64 = 50;
const MAX_SLIPPAGE_BPS: u64 = 25;
const MIN_DEPTH_USD: u64 = 10_000;
const SAFETY_THRESHOLD: u64 = 10_000;
const SPREAD_WEIGHT: u128 = 100;
const SLIPPAGE_WEIGHT: u128 = 120;
const DEPTH_FIXED_SCALE: u128 = 10_000;

sol_storage! {
    #[entrypoint]
    pub struct SliverVineSoilCoprocessor {}
}

#[public]
impl SliverVineSoilCoprocessor {
    /// Evaluate soil resistance; returns `(passed, score)` with fail-closed semantics.
    pub fn evaluate_soil_coprocessor(
        &self,
        spread_bps: U256,
        depth_usd: U256,
        slippage_bps: U256,
    ) -> Result<(bool, U256), Vec<u8>> {
        let spread = u256_to_u64_fail_closed(spread_bps)?;
        let depth = u256_to_u64_fail_closed(depth_usd)?;
        let slippage = u256_to_u64_fail_closed(slippage_bps)?;
        let (passed, score) = evaluate_soil_coprocessor_core(spread, depth, slippage);
        Ok((passed, U256::from(score)))
    }
}

fn u256_to_u64_fail_closed(value: U256) -> Result<u64, Vec<u8>> {
    if value > U256::from(u64::MAX) {
        return Err(b"SOIL_U64_OVERFLOW".to_vec());
    }
    Ok(value.to::<u64>())
}

/// Core fixed-point soil resistance evaluator (pure, no storage).
pub fn evaluate_soil_coprocessor_core(
    spread_bps: u64,
    depth_usd: u64,
    slippage_bps: u64,
) -> (bool, u64) {
    if depth_usd < MIN_DEPTH_USD {
        return (false, u64::MAX);
    }

    let mut score = (spread_bps as u128)
        .saturating_mul(SPREAD_WEIGHT)
        .saturating_add((slippage_bps as u128).saturating_mul(SLIPPAGE_WEIGHT));

    let depth_penalty = (MIN_DEPTH_USD as u128)
        .saturating_mul(DEPTH_FIXED_SCALE)
        / (depth_usd as u128);
    score = score.saturating_add(depth_penalty);

    if spread_bps > MAX_SPREAD_BPS {
        let excess = spread_bps - MAX_SPREAD_BPS;
        score = score.saturating_add((excess as u128).saturating_mul(excess as u128));
    }
    if slippage_bps > MAX_SLIPPAGE_BPS {
        let excess = slippage_bps - MAX_SLIPPAGE_BPS;
        score = score.saturating_add((excess as u128).saturating_mul(excess as u128));
    }

    if score > SAFETY_THRESHOLD as u128 {
        return (false, u64::MAX);
    }

    (true, score as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn passes_healthy_book() {
        let (ok, score) = evaluate_soil_coprocessor_core(30, 100_000, 10);
        assert!(ok);
        assert_eq!(score, 5_200);
    }

    #[test]
    fn fails_shallow_depth() {
        let (ok, score) = evaluate_soil_coprocessor_core(10, 9_999, 5);
        assert!(!ok);
        assert_eq!(score, u64::MAX);
    }

    #[test]
    fn fails_quadratic_spread_breach() {
        let (ok, score) = evaluate_soil_coprocessor_core(100, 100_000, 10);
        assert!(!ok);
        assert_eq!(score, u64::MAX);
    }

    #[test]
    fn fails_score_above_threshold_at_min_depth() {
        let (ok, score) = evaluate_soil_coprocessor_core(50, 10_000, 25);
        assert!(!ok);
        assert_eq!(score, u64::MAX);
    }

    #[test]
    fn applies_slippage_quadratic_penalty() {
        let (ok, score) = evaluate_soil_coprocessor_core(20, 50_000, 50);
        assert!(!ok);
        assert_eq!(score, u64::MAX);
    }
}
