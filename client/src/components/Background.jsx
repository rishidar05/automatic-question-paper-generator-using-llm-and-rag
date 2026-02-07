import React, { useEffect, useState } from 'react';

const Star = ({ style }) => (
    <div style={{
        position: 'absolute',
        background: 'white',
        borderRadius: '50%',
        ...style
    }} />
);

const Background = () => {
    const [stars, setStars] = useState([]);

    useEffect(() => {
        const generateStars = () => {
            const count = 200;
            const newStars = [];
            for (let i = 0; i < count; i++) {
                newStars.push({
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3}px`,
                    height: `${Math.random() * 3}px`,
                    animationDuration: `${Math.random() * 3 + 2}s`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: Math.random()
                });
            }
            setStars(newStars);
        };
        generateStars();
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            background: 'radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)',
            overflow: 'hidden'
        }}>
            {stars.map((star, i) => (
                <div
                    key={i}
                    className="star"
                    style={{
                        position: 'absolute',
                        left: star.left,
                        top: star.top,
                        width: star.width,
                        height: star.height,
                        background: 'white',
                        borderRadius: '50%',
                        opacity: star.opacity,
                        animation: `twinkle ${star.animationDuration}s infinite ease-in-out alternate`
                    }}
                />
            ))}
            <style>
                {`
                    @keyframes twinkle {
                        0% { opacity: 0.2; transform: scale(0.8); }
                        100% { opacity: 1; transform: scale(1.2); }
                    }
                `}
            </style>
        </div>
    );
};

export default Background;
