/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // Team colors come from CSS variables in globals.css (theme)
                'team-red': {
                    DEFAULT: 'rgb(var(--team-red-rgb) / <alpha-value>)',
                    light: 'var(--team-red-light)',
                    dark: 'var(--team-red-dark)',
                    deep: 'var(--team-red-deep)',
                },
                'team-blue': {
                    DEFAULT: 'rgb(var(--team-blue-rgb) / <alpha-value>)',
                    light: 'var(--team-blue-light)',
                    dark: 'var(--team-blue-dark)',
                    deep: 'var(--team-blue-deep)',
                },
                'scorecard-navy': '#1a1a3e',
                'forest-deep': '#0a4030',
                'forest-mid': '#147255',
                'gold-border': '#fbbc05',
                'gold-light': '#fce8b2',
                'brass': '#e37400',
                'nav-teal': '#1a4a5e',
                'cream': '#ffffff',
                'header-navy': '#1a2b3c',
                'ryder-bg': '#e6f4ea',
                'ryder-dark': '#1e293b',
                'stroke-dark': '#1e293b',
            },
            fontFamily: {
                bangers: ['var(--font-bangers)', 'cursive'],
                fredoka: ['var(--font-fredoka)', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
