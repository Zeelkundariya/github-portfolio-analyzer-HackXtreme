import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts';
import { GraphIcon } from "@primer/octicons-react";
import { API_BASE_URL } from "../config";

const ScoreHistory = ({ username, lastUpdated, events, totalLifetimeContributions }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [contributionData, setContributionData] = useState([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/history/${username}`);
                if (res.ok) {
                    const data = await res.json();
                    const formattedData = data.map((item, index) => {
                        const timestamp = isNaN(item.timestamp) ? item.timestamp + " Z" : parseInt(item.timestamp);
                        const dateObj = new Date(timestamp);
                        const isToday = new Date().toDateString() === dateObj.toDateString();

                        return {
                            score: item.score,
                            contributions: item.contributions || 0,
                            timeLabel: isToday
                                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : `${dateObj.getMonth() + 1}/${dateObj.getDate()} ${dateObj.getHours()}:${dateObj.getMinutes().toString().padStart(2, '0')}`,
                            date: dateObj.toLocaleDateString(),
                            fullDate: dateObj.toLocaleString(),
                            timestamp: dateObj.getTime()
                        };
                    }).sort((a, b) => a.timestamp - b.timestamp);
                    setHistory(formattedData);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };

        if (username) {
            fetchHistory();
        }
    }, [username, lastUpdated]);

    useEffect(() => {
        if (events && events.length > 0) {
            const counts = {};
            events.forEach(event => {
                const date = new Date(event.created_at).toLocaleDateString();
                counts[date] = (counts[date] || 0) + 1;
            });

            // Calculate historical baseline (total before the 30-day window)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let runningTotal = events.filter(e => new Date(e.created_at) < thirtyDaysAgo).length;

            const result = [];
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toLocaleDateString();

                // Add today's count to the running total
                runningTotal += (counts[dateStr] || 0);

                result.push({
                    date: dateStr,
                    count: runningTotal, // This is now the cumulative total
                    daily: counts[dateStr] || 0, // Keep daily for tooltip if needed
                    label: d.toLocaleDateString([], { month: 'short', day: 'numeric' })
                });
            }
            setContributionData(result);
        }
    }, [events]);

    if (loading) return null;

    return (
        <div className="card animate-fade-in" style={{ marginTop: '2rem', padding: '40px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(47, 129, 247, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent-color)' }}>
                    <GraphIcon size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', letterSpacing: '-0.5px' }}>Analytical Velocity & History</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cross-referencing activity density with architectural signal growth.</p>
                        <span style={{ color: 'var(--text-secondary)', opacity: 0.3 }}>•</span>
                        <strong style={{ fontSize: '0.9rem', color: '#39d353', letterSpacing: '0.5px' }}>
                            {totalLifetimeContributions || 0} LIFETIME CONTRIBUTIONS
                        </strong>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '48px' }}>
                {/* 30-Day Velocity Section */}
                {contributionData.length > 0 && (
                    <div className="analytics-block">
                        <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '4px', height: '16px', background: '#39d353', borderRadius: '2px' }}></div>
                            CONTRIBUTION GROWTH (30D TOTAL)
                        </h4>
                        <div style={{ width: '100%', height: 220, background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={contributionData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#39d353" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#39d353" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        stroke="var(--text-secondary)"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                        fontFamily='"JetBrains Mono", monospace'
                                    />
                                    <YAxis
                                        stroke="var(--text-secondary)"
                                        fontSize={9}
                                        tickLine={false}
                                        axisLine={false}
                                        dx={-10}
                                        fontFamily='"JetBrains Mono", monospace'
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'var(--obsidian-deep)',
                                            borderColor: 'var(--glass-border)',
                                            borderRadius: '12px',
                                            color: 'var(--text-primary)',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                            padding: '12px',
                                            fontSize: '0.8rem',
                                            fontFamily: '"JetBrains Mono", monospace'
                                        }}
                                        itemStyle={{ color: '#39d353', fontWeight: '800' }}
                                        labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px', fontSize: '0.7rem' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        name="Total Contributions"
                                        stroke="#39d353"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>

            {history.length >= 2 ? (
                <>
                    <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '20px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '4px', height: '16px', background: 'var(--accent-color)', borderRadius: '2px' }}></div>
                        ARCHITECTURAL SIGNAL EVOLUTION
                    </h4>
                    <div style={{ width: '100%', height: 350, background: 'rgba(0,0,0,0.2)', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.4)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="timeLabel"
                                    stroke="var(--text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                    fontFamily='"JetBrains Mono", monospace'
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    stroke="var(--text-secondary)"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    dx={-10}
                                    fontFamily='"JetBrains Mono", monospace'
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--obsidian-deep)',
                                        borderColor: 'var(--glass-border)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                        padding: '16px',
                                        fontSize: '0.9rem',
                                        fontFamily: '"JetBrains Mono", monospace'
                                    }}
                                    itemStyle={{ color: 'var(--accent-color)', fontWeight: '800' }}
                                    labelStyle={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.7rem' }}
                                    labelFormatter={(value, payload) => payload[0]?.payload.fullDate || value}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    name="Signal Score"
                                    stroke="var(--accent-color)"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', padding: '60px 40px', border: '1px dashed var(--border-color)', borderRadius: '24px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ marginBottom: '24px', opacity: 0.1 }}>
                        <GraphIcon size={64} />
                    </div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1.2rem' }}>Awaiting Analytical History</h4>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                        Generate multiple reports to unlock longitudinal engineering signal and contribution trends.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ScoreHistory;
