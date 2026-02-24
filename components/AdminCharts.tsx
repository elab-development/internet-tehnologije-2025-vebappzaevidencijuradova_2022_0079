'use client';

import { useEffect, useState } from 'react';

interface StatsData {
    usersByRole: {
        studentCount: number;
        teacherCount: number;
        adminCount: number;
    };
    submissionsPerCourse: {
        name: string;
        submissions: number;
    }[];
}

export function AdminCharts() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [chartsLoaded, setChartsLoaded] = useState(false);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then((r) => r.json())
            .then((data) => setStats(data));
    }, []);

    useEffect(() => {
        // Load Google Charts script
        if (typeof window === 'undefined') return;
        if ((window as any).google?.charts) {
            setChartsLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.gstatic.com/charts/loader.js';
        script.onload = () => {
            (window as any).google.charts.load('current', { packages: ['corechart', 'bar'] });
            (window as any).google.charts.setOnLoadCallback(() => setChartsLoaded(true));
        };
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        if (!chartsLoaded || !stats) return;
        drawPieChart();
        drawBarChart();
    }, [chartsLoaded, stats]);

    const drawPieChart = () => {
        if (!stats) return;
        const google = (window as any).google;
        const data = google.visualization.arrayToDataTable([
            ['Uloga', 'Broj korisnika'],
            ['Studenti', stats.usersByRole.studentCount],
            ['Nastavnici', stats.usersByRole.teacherCount],
            ['Admini', stats.usersByRole.adminCount],
        ]);

        const options = {
            title: 'Korisnici po ulozi',
            titleTextStyle: { fontSize: 16, bold: true, color: '#111827' },
            colors: ['#3b82f6', '#8b5cf6', '#ef4444'],
            legend: { position: 'bottom' },
            chartArea: { width: '85%', height: '70%' },
            backgroundColor: 'transparent',
            pieHole: 0.4,
        };

        const chart = new google.visualization.PieChart(
            document.getElementById('pie-chart')
        );
        chart.draw(data, options);
    };

    const drawBarChart = () => {
        if (!stats || stats.submissionsPerCourse.length === 0) return;
        const google = (window as any).google;

        const rows = stats.submissionsPerCourse.map((c) => [c.name, c.submissions]);
        const data = google.visualization.arrayToDataTable([
            ['Predmet', 'Predati radovi'],
            ...rows,
        ]);

        const options = {
            title: 'Predati radovi po predmetu',
            titleTextStyle: { fontSize: 16, bold: true, color: '#111827' },
            colors: ['#10b981'],
            legend: { position: 'none' },
            chartArea: { width: '75%', height: '65%' },
            backgroundColor: 'transparent',
            hAxis: { title: 'Broj radova', minValue: 0, format: '0' },
            vAxis: { textStyle: { fontSize: 12 } },
            bar: { groupWidth: '60%' },
        };

        const chart = new google.visualization.BarChart(
            document.getElementById('bar-chart')
        );
        chart.draw(data, options);
    };

    if (!stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {[1, 2].map((i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-6 h-72 flex items-center justify-center">
                        <p className="text-gray-400 text-sm animate-pulse">Učitavanje grafa...</p>
                    </div>
                ))}
            </div>
        );
    }

    const totalUsers =
        stats.usersByRole.studentCount +
        stats.usersByRole.teacherCount +
        stats.usersByRole.adminCount;

    const hasSubmissions = stats.submissionsPerCourse.some((c) => c.submissions > 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Pie chart */}
            <div className="bg-white rounded-lg shadow p-6">
                {totalUsers === 0 ? (
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        Nema korisnika u sistemu
                    </div>
                ) : (
                    <div id="pie-chart" style={{ height: '280px' }} />
                )}
            </div>

            {/* Bar chart */}
            <div className="bg-white rounded-lg shadow p-6">
                {!hasSubmissions ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-lg font-medium mb-1">Predati radovi po predmetu</p>
                        <p className="text-sm">Nema predatih radova</p>
                    </div>
                ) : (
                    <div id="bar-chart" style={{ height: '280px' }} />
                )}
            </div>
        </div>
    );
}
