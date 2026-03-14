import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    circle?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '100%',
    className = '',
    circle = false
}) => {
    return (
        <motion.div
            className={`bg-white/5 overflow-hidden relative ${circle ? 'rounded-full' : 'rounded-xl'} ${className}`}
            style={{ width, height }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1,
                ease: "easeInOut"
            }}
        >
            <motion.div
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ translateX: ['-100%', '100%'] }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear",
                    repeatDelay: 0.5
                }}
            />
        </motion.div>
    );
};

export default Skeleton;
