/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            'team-red': '#C8102E',
            'team-blue': '#003399',
            'header-navy': '#333333', // Dark charcoal as requested for dividers/dark elements? Or keep Navy separate? User said "Center Divider (Numbers): #333333". 
            // Let's keep header-navy as is if used elsewhere, but maybe map it to the new dark if appropriate. 
            // Actually, the main header was "header-navy". User wants "Header Background: #F9F9F9". 
            // So the TOP header (navigation) might change. 
            // For now, let's just update the team colors and add the new ones.
            'ryder-bg': '#F9F9F9',
            'ryder-dark': '#333333',
        },
    },
    plugins: [],
}
