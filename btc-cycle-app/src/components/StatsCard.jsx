import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, date, type = 'neutral', className, delay = 0 }) => {
    const colors = {
        neutral: 'border-white/10 text-white',
        success: 'border-neon-green/30 text-neon-green shadow-neon-green/10',
        danger: 'border-neon-red/30 text-neon-red shadow-neon-red/10',
        purple: 'border-neon-purple/30 text-neon-purple shadow-neon-purple/10',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,0,0,0.6)' }}
            className={twMerge(
                "relative overflow-hidden bg-black/40 backdrop-blur-md border rounded-xl p-6 shadow-lg cursor-default",
                colors[type],
                className
            )}
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                {/* Abstract Icon or Shape */}
                <div className={clsx("w-16 h-16 rounded-full blur-xl", {
                    'bg-white': type === 'neutral',
                    'bg-neon-green': type === 'success',
                    'bg-neon-red': type === 'danger',
                    'bg-neon-purple': type === 'purple',
                })} />
            </div>

            <h4 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">{title}</h4>
            <div className="flex flex-col">
                <span className={clsx("text-3xl font-bold mb-1", {
                    'text-white': type === 'neutral',
                    'text-neon-green': type === 'success',
                    'text-neon-red': type === 'danger',
                    'text-neon-purple': type === 'purple',
                })}>
                    {value}
                </span>
                <span className="text-gray-500 text-sm font-mono">{date}</span>
            </div>
        </motion.div>
    );
};

export default StatsCard;
