// SPDX-License-Identifier: MIT
// SilverVine Protocol (v0.9) - SanmHUD Premium Visual Component
// Core: Level 5 Emergency UI Adaptation (De-noised, 0 Formula Leak)

import React, { useEffect, useState } from 'react';

interface TelemetryFrame {
  system_status: string;
  nirvana_rwa_evacuation_triggered: boolean;
  isomorphic_metrics: {
    fci_index: number;
    hawking_chronology_protection_delta: number;
    string_tension_amplitude: number;
  };
  chakra_flow: {
    active_center: string;
  };
}

export const NirvanaEvacuationShield: React.FC<{ currentFrame: TelemetryFrame }> = ({ currentFrame }) => {
  const [isEvaporating, setIsEvaporating] = useState(false);

  useEffect(() => {
    if (currentFrame?.nirvana_rwa_evacuation_triggered) {
      setIsEvaporating(true);
    } else {
      setIsEvaporating(false);
    }
  }, [currentFrame]);

  if (!isEvaporating) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-fade-in font-mono text-zinc-100">
      {/* 天能時空逆轉：背景網格幾何非線形坍塌視覺特效 */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ff3b30_1px,transparent_1px)] [background-size:20px_20px] animate-[pulse_1.5s_infinite]"></div>
      
      <div className="relative max-w-xl w-full mx-4 p-8 bg-zinc-950 border border-red-500/40 rounded-lg shadow-[0_0_60px_rgba(255,59,48,0.2)] text-center overflow-hidden">
        {/* 頂部雷達掃描線：模擬因果截斷動態 */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent animate-[bounce_2s_infinite]" />

        {/* 5 級最高特別警報視覺門面 */}
        <div className="inline-block px-3 py-1 mb-4 bg-red-600 border border-red-400 text-white text-xs tracking-widest uppercase font-bold rounded animate-pulse">
          LEVEL 5 EMERGENCY: TIME-ARROW EVACUATION (5級最高特別警報：時序撤離)
        </div>

        {/* 核心大白話解說：散戶救贖故事 */}
        <h2 className="text-xl font-bold mb-2 tracking-wide">
          因果關係截斷 ・ 頂輪寂滅激活
        </h2>
        <p className="text-zinc-400 text-[11px] font-sans px-4 mb-6 leading-relaxed">
          本地異步哨兵已透過【熱力學綜合加權矩陣】判定網絡 Gas 洪水與 RPC 痙攣發生高頻非線性相變。為免黑客與高速婆婆發動盲區踩踏清算，系統已於真實區塊落定前 500ms 逆轉時間熵，強制拉下主電閘！
        </p>

        {/* 遙測幾何數據即時渲染（完全脫敏，只做數據映射） */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded text-left mb-6 text-xs">
          <div>
            <div className="text-[9px] text-zinc-500 uppercase">結構形變幾何指數</div>
            <div className="text-red-400 font-bold">{(currentFrame.isomorphic_metrics.fci_index * 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase">時序保護臨界增量</div>
            <div className="text-red-400 font-bold">{currentFrame.isomorphic_metrics.hawking_chronology_protection_delta.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[9px] text-zinc-500 uppercase">多維環境總體熵</div>
            <div className="text-red-400 font-bold">{currentFrame.isomorphic_metrics.string_tension_amplitude.toFixed(4)}</div>
          </div>
        </div>

        {/* 資產量子蒸發原子狀態欄 */}
        <div className="flex flex-col items-center justify-center p-4 border border-emerald-500/20 bg-emerald-950/10 rounded">
          <div className="flex items-center space-x-2 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
              全息結構歸零：流動性原子蒸發中 (0-Entropy State Verified)
            </span>
          </div>
          <span className="text-[10px] text-zinc-500 mt-1 font-sans">
            私有池 Wallet C/D 資產已 100% 移出高風險 DeFi 血管，成功折射撤回 RWA 實物國債隔離金庫
          </span>
        </div>
      </div>
    </div>
  );
};
