export function renderDashboard(app) {
    app.innerHTML = `
        <section>
            <h2>Dashboard</h2>

            <div class="card">
                <h3>This Week</h3>
                <p>Deep Work : 0 / 20 hrs</p>
                <p>Reels : 0 / 3 hrs</p>
            </div>

            <div class="card">
                <h3>Quick Capture</h3>
                <input placeholder="New idea...">
            </div>
        </section>
    `;
}