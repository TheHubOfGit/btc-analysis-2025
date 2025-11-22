import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ComposedChart,
    Line,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList
} from 'recharts';

const CustomTooltip = ({ active, payload, label, cyclePoints }) => {
    if (active && payload && payload.length) {
        const currentTimestamp = new Date(label).getTime();

        // Logic-based snapping: Find nearest cycle point within threshold
        let nearestPoint = null;
        let minDiff = Infinity;
        // Threshold: ~30 days in milliseconds (1 month)
        // This ensures that if you are visually close to the point, it snaps to it.
        const THRESHOLD = 30 * 24 * 60 * 60 * 1000;

        if (cyclePoints) {
            cyclePoints.forEach(point => {
                const pointTime = new Date(point.date).getTime();
                const diff = Math.abs(currentTimestamp - pointTime);
                if (diff < minDiff && diff < THRESHOLD) {
                    minDiff = diff;
                    nearestPoint = point;
                }
            });
        }

        // If we found a close point, show that instead of the line data
        if (nearestPoint) {
            return (
                <div className="bg-black/90 backdrop-blur-xl border border-neon-purple/30 p-4 rounded-lg shadow-2xl min-w-[200px]">
                    <p className="text-gray-400 text-xs font-mono mb-2">{new Date(nearestPoint.date).toLocaleDateString()}</p>

                    <div className="mb-3 pb-3 border-b border-white/10">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1"
                            style={{ backgroundColor: nearestPoint.fill, color: '#000' }}>
                            {nearestPoint.name.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="text-neon-green font-bold text-2xl">
                            ${nearestPoint.price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-gray-500 text-xs">USD</span>
                    </div>
                </div>
            );
        }

        // Fallback to standard behavior (showing line data)
        const data = payload[0];
        return (
            <div className="bg-black/90 backdrop-blur-xl border border-neon-purple/30 p-4 rounded-lg shadow-2xl min-w-[200px]">
                <p className="text-gray-400 text-xs font-mono mb-2">{new Date(label).toLocaleDateString()}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-neon-green font-bold text-2xl">
                        ${data.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                    <span className="text-gray-500 text-xs">USD</span>
                </div>
            </div>
        );
    }
    return null;
};

const CycleChart = ({ data, cycles, forecast }) => {
    const [isLogScale, setIsLogScale] = useState(true);

    // Prepare scatter data for cycle points
    const scatterData = [...cycles];
    if (forecast) {
        Object.values(forecast).forEach(f => {
            scatterData.push({
                ...f,
                isForecast: true
            });
        });
    }

    // Add styling properties to scatter data
    const styledScatterData = scatterData.map(c => ({
        ...c,
        // Check Projected points first, then historical points
        fill: c.name.includes('Projected') && c.name.includes('High') ? '#bd00ff' :  // Purple for Projected Highs
            c.name.includes('Projected') && c.name.includes('Low') ? '#ff7700' :   // Orange for Projected Lows  
                c.name.includes('ATH') || c.name.includes('High') ? '#00ff9d' :         // Green for Historical Highs
                    '#ff0055',  // Red for Historical Lows
        r: 8 // Increased scatter radius
    }));

    // Prepare historical data (smooth curve)
    const historicalData = [...data];

    // Prepare forecast data (straight lines between points)
    // Sort forecast points by date to ensure correct line drawing
    const sortedForecast = Object.values(forecast || {})
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Only add forecast points that are after the last data point
    const lastDate = new Date(data[data.length - 1]?.date);

    // Create forecast line data - start from Projected ATH 2025
    const forecastData = [];
    if (sortedForecast.length > 0) {
        // Add all forecast points (including ATH 2025 as the starting point)
        sortedForecast.forEach(point => {
            forecastData.push({
                date: point.date,
                price: point.price,
                isForecast: true
            });
        });
    }

    // Create a line connecting all cycle points (ATL/ATH markers) - fainter dotted line
    const cyclePointsLine = [];
    if (cycles && cycles.length > 0) {
        // Add historical cycle points
        cycles.forEach(point => {
            cyclePointsLine.push({
                date: point.date,
                price: point.price,
                isCyclePoint: true
            });
        });
    }
    // Add forecast points to cycle line as well
    if (sortedForecast.length > 0) {
        sortedForecast.forEach(point => {
            cyclePointsLine.push({
                date: point.date,
                price: point.price,
                isCyclePoint: true
            });
        });
    }
    // Sort by date
    cyclePointsLine.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate min and max for domain from all data
    const allPrices = [
        ...historicalData.map(d => d.price),
        ...forecastData.map(d => d.price),
        ...styledScatterData.map(d => d.price)
    ];
    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);

    // Prepare data with timestamps for linear X-axis
    const processData = (items) => items.map(item => ({
        ...item,
        timestamp: new Date(item.date).getTime()
    }));

    const historicalDataWithTime = processData(historicalData);
    const forecastDataWithTime = processData(forecastData);
    const cyclePointsLineWithTime = processData(cyclePointsLine);
    const scatterDataWithTime = processData(styledScatterData);

    // Custom scatter point with large hit area
    const renderCustomScatterPoint = (props) => {
        const { cx, cy, fill, payload } = props;
        return (
            <g className="recharts-layer recharts-scatter-symbol" style={{ cursor: 'crosshair' }}>
                {/* Invisible massive hit area */}
                <circle cx={cx} cy={cy} r={20} fill="transparent" stroke="none" />
                {/* Visible dot */}
                <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#fff" strokeWidth={2} />
                {/* Pulse effect for forecast points */}
                {payload.isForecast && (
                    <circle cx={cx} cy={cy} r={6} fill="transparent" stroke={fill} strokeWidth={2}>
                        <animate attributeName="r" from="6" to="12" dur="1.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="1" to="0" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                )}
            </g>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full h-[600px] bg-black/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 shadow-2xl"
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                    BTC Price Cycles ({isLogScale ? 'Log' : 'Linear'} Scale)
                </h3>
                <div className="flex items-center gap-6">
                    <div className="flex gap-4 text-xs text-gray-400">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#00ff9d]"></span> Cycle High
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-[#ff0055]"></span> Cycle Low
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLogScale(!isLogScale)}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-purple/50 text-gray-300 hover:text-white transition-all duration-200"
                    >
                        {isLogScale ? 'Log Scale' : 'Linear Scale'}
                    </button>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={historicalDataWithTime}
                    margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={[new Date('2014-09-16').getTime(), 'dataMax']}
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickFormatter={(ts) => new Date(ts).getFullYear()}
                        minTickGap={50}
                    />
                    <YAxis
                        dataKey="price"
                        scale={isLogScale ? "log" : "linear"}
                        domain={[minPrice * 0.8, maxPrice * 1.2]}
                        stroke="#666"
                        tick={{ fill: '#666', fontSize: 12 }}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                        width={80}
                    />
                    <Tooltip
                        content={<CustomTooltip cyclePoints={styledScatterData} />}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        labelFormatter={(ts) => new Date(ts).toLocaleDateString()}
                        trigger="hover"
                    />

                    {/* Historical data - smooth curve */}
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={true}
                        animationDuration={2000}
                    />

                    {/* Forecast data - straight lines */}
                    <Line
                        data={forecastDataWithTime}
                        type="linear"
                        dataKey="price"
                        stroke="#bd00ff"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={false}
                        isAnimationActive={true}
                        animationDuration={2000}
                    />

                    {/* Cycle points connection - faint dotted line */}
                    <Line
                        data={cyclePointsLineWithTime}
                        type="linear"
                        dataKey="price"
                        stroke="#888888"
                        strokeWidth={1.5}
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                        dot={false}
                        activeDot={false}
                        isAnimationActive={true}
                        animationDuration={2000}
                    />

                    <Scatter
                        data={scatterDataWithTime}
                        dataKey="price"
                        shape={renderCustomScatterPoint}
                        isAnimationActive={true}
                        animationDuration={2000}
                    >
                        <LabelList
                            dataKey="name"
                            position="top"
                            offset={15}
                            formatter={(val) => val.replace(/_/g, ' ')}
                            style={{ fill: '#fff', fontSize: '10px', opacity: 0.7, pointerEvents: 'none' }}
                        />
                    </Scatter>

                </ComposedChart>
            </ResponsiveContainer>
        </motion.div>
    );
};

export default CycleChart;
