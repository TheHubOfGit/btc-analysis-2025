import React from 'react';
import { TrendingUp, Calendar, Activity } from 'lucide-react';

const Hero = ({ nextEvent }) => {
    return (
        <div className="relative w-full py-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/20 rounded-full blur-[120px] -z-10" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                <Activity size={14} className="text-neon-green" />
                <span className="text-xs font-medium text-gray-300 uppercase tracking-widest">Live Cycle Analysis</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                BTC <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-green to-neon-purple">4-Year Cycle</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
                Visualizing the rhythmic heartbeat of Bitcoin. Analyzing historical patterns to forecast future highs and lows with precision.
            </p>

            {nextEvent && (
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-4 px-6 py-4 bg-black/60 border border-neon-purple/30 rounded-2xl backdrop-blur-md">
                        <div className="p-3 bg-neon-purple/10 rounded-xl">
                            <Calendar className="text-neon-purple" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm text-gray-400">Next Major Event</p>
                            <p className="text-lg font-bold text-white">{nextEvent}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Hero;
