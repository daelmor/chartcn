import React from "react";
import type { ChartConfig } from "../../schemas/chart-config.js";

interface ChartWrapperProps {
  config: ChartConfig;
  width: number;
  height: number;
  children: React.ReactNode;
}

export function ChartWrapper({ config, width, height, children }: ChartWrapperProps) {
  const headerHeight = config.title ? (config.description ? 50 : 30) : 0;
  const chartHeight = height - headerHeight - 32; // 32 for padding

  return (
    <div className="chart-container" style={{ width, height }}>
      {config.title && (
        <div className="chart-header">
          <div className="chart-title">{config.title}</div>
          {config.description && (
            <div className="chart-description">{config.description}</div>
          )}
        </div>
      )}
      <div style={{ width: width - 32, height: Math.max(chartHeight, 100) }}>
        {children}
      </div>
    </div>
  );
}
