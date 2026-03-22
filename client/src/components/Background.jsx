import React, { useEffect, useState } from 'react';

const Background = () => {
    const [particles, setParticles] = useState([]);
    const [ripples, setRipples] = useState([]);
    const [trail, setTrail] = useState([]);

    useEffect(() => {
        const handleClick = (e) => {
            // Prevent background effect when clicking on UI cards, inputs, buttons
            if (e.target.closest('.glass-card') || e.target.closest('.paper-container') ||
                ['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            const count = 40; // Number of stars per click
            const newParticles = [];
            const timestamp = Date.now();

            // Generate Stars
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const velocity = 40 + Math.random() * 150; // Explosion radius

                newParticles.push({
                    id: `${timestamp}-p-${i}`,
                    x: e.clientX,
                    y: e.clientY,
                    dx: Math.cos(angle) * velocity,
                    dy: Math.sin(angle) * velocity,
                    size: Math.random() * 4 + 2,
                    color: ['#c084fc', '#818cf8', '#f472b6', '#ffffff'][Math.floor(Math.random() * 4)],
                    duration: 0.6 + Math.random() * 0.6
                });
            }

            // Generate Ripple Wave
            const newRipple = {
                id: `${timestamp}-r`,
                x: e.clientX,
                y: e.clientY,
            };

            setParticles(prev => [...prev, ...newParticles]);
            setRipples(prev => [...prev, newRipple]);

            // Cleanup particles after animation
            setTimeout(() => {
                setParticles(prev => prev.filter(p => !p.id.startsWith(`${timestamp}-p`)));
                setRipples(prev => prev.filter(r => r.id !== `${timestamp}-r`));
            }, 1500);
        };

        let lastMove = 0;
        const handleMouseMove = (e) => {
            // e.buttons >= 1 means a mouse button is actively held down (dragging)
            if (e.buttons < 1) return;

            // Prevent trailing when dragging over UI
            if (e.target.closest('.glass-card') || e.target.closest('.paper-container') ||
                ['INPUT', 'BUTTON', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            const now = Date.now();
            if (now - lastMove < 25) return; // Throttle trail generation
            lastMove = now;

            const count = 2; // Create a small cluster of dust particles on drag
            const newTrailParticles = [];

            for (let i = 0; i < count; i++) {
                // Randomize slightly around the mouse pointer
                const offset_x = (Math.random() - 0.5) * 15;
                const offset_y = (Math.random() - 0.5) * 15;

                newTrailParticles.push({
                    id: `${now}-t-${i}`,
                    x: e.clientX + offset_x,
                    y: e.clientY + offset_y,
                    size: Math.random() * 5 + 1,
                    color: ['#c084fc', '#818cf8', '#ffffff'][Math.floor(Math.random() * 3)],
                    duration: 0.5 + Math.random() * 0.5
                });
            }

            setTrail(prev => [...prev.slice(-40), ...newTrailParticles]); // Keep maximum of ~40 items in state

            setTimeout(() => {
                setTrail(prev => prev.filter(p => !p.id.startsWith(`${now}-t-`)));
            }, 1000);
        };

        window.addEventListener('click', handleClick);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1,
            background: 'radial-gradient(ellipse at bottom, #111827 0%, #020617 100%)',
            overflow: 'hidden',
            pointerEvents: 'none' // Ensures background never intercepts legitimate clicks
        }}>
            {/* Trail Particles (Cosmic Dust behind drag) */}
            {trail.map((t) => (
                <div
                    key={t.id}
                    className="trail"
                    style={{
                        position: 'absolute',
                        left: t.x - t.size / 2,
                        top: t.y - t.size / 2,
                        width: t.size,
                        height: t.size,
                        background: t.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${t.size}px ${t.color}`,
                        animation: `trailAnim ${t.duration}s ease-out forwards`
                    }}
                />
            ))}

            {/* Click Burst Particles */}
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="particle"
                    style={{
                        position: 'absolute',
                        left: p.x - p.size / 2,
                        top: p.y - p.size / 2,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        '--dx': `${p.dx}px`,
                        '--dy': `${p.dy}px`,
                        animation: `explode ${p.duration}s cubic-bezier(0.1, 0.9, 0.2, 1) forwards`
                    }}
                />
            ))}

            {/* Click Ripples */}
            {ripples.map((r) => (
                <div
                    key={r.id}
                    style={{
                        position: 'absolute',
                        left: r.x,
                        top: r.y,
                        width: '20px',
                        height: '20px',
                        marginLeft: '-10px',
                        marginTop: '-10px',
                        borderRadius: '50%',
                        border: '2px solid rgba(192, 132, 252, 0.5)',
                        boxShadow: '0 0 20px rgba(192, 132, 252, 0.4)',
                        animation: 'ripple 1s cubic-bezier(0.1, 0.9, 0.2, 1) forwards'
                    }}
                />
            ))}

            <style>
                {`
                    @keyframes explode {
                        0% { transform: translate(0, 0) scale(1.5); opacity: 1; }
                        100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
                    }
                    @keyframes ripple {
                        0% { transform: scale(1); opacity: 0.8; }
                        100% { transform: scale(25); opacity: 0; }
                    }
                    @keyframes trailAnim {
                        0% { transform: scale(1); opacity: 1; }
                        100% { transform: scale(0); opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
};

export default Background;
