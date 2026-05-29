import React from 'react';

const PageLoader: React.FC = () => (
    <div className="flex items-center justify-center min-h-[400px] p-8">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
);

export default PageLoader;
