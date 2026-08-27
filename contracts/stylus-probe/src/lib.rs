//! SliverVineSoilProbe — minimal Stylus probe mirroring Edge soil gate baseline.
//! SPDX-License-Identifier: BUSL-1.1
//!
//! Baseline: `spread_bps <= 50` AND `depth_usd >= 10_000` → pass (returns true).

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use stylus_sdk::alloy_primitives::U256;
use stylus_sdk::prelude::*;

const MAX_SPREAD_BPS: u64 = 50;
const MIN_DEPTH_USD: u64 = 10_000;

sol_storage! {
    #[entrypoint]
    pub struct SliverVineSoilProbe {}
}

#[public]
impl SliverVineSoilProbe {
    /// Returns true when spread and depth satisfy the Citadel soil baseline.
    pub fn check_soil_probe(&self, spread_bps: U256, depth_usd: U256) -> Result<bool, Vec<u8>> {
        Ok(spread_bps <= U256::from(MAX_SPREAD_BPS) && depth_usd >= U256::from(MIN_DEPTH_USD))
    }
}
