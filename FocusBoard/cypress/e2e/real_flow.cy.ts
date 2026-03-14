const BASE_API = 'http://localhost:5000';

describe('Real Frontend Workflow (No Mocks)', () => {
    const email = 'student@example.com';
    const password = 'Password123!';

    it('loads dashboard data, drilldown, and navigates all menus', () => {
        cy.request('POST', `${BASE_API}/api/auth/login`, { email_id: email, password })
            .then((res) => {
                expect(res.status).to.eq(200);
                const token = res.body?.data?.token;
                expect(token).to.be.a('string');

                cy.visit('/', {
                    onBeforeLoad(win) {
                        win.localStorage.setItem('focusboard_token', token);
                        win.localStorage.removeItem('focusboard_e2e');
                    }
                });
            });

        // Dashboard metrics + timeline
        cy.contains('Daily Overview', { timeout: 15000 }).should('exist');
        cy.get('button[aria-label^="Deep Work"]', { timeout: 15000 }).should('exist');
        cy.get('button[aria-label^="Switches"]', { timeout: 15000 }).should('exist');

        // Drilldown from Daily Overview report
        cy.contains('View Report').click({ force: true });
        cy.contains('Daily Overview', { timeout: 10000 }).should('exist');
        cy.contains('Algorithms Assignment', { timeout: 10000 }).should('exist');

        // Back to dashboard
        cy.contains('Dashboard').click({ force: true });

        // Navigate through all menus
        cy.get('nav').contains('Reports').click();
        cy.contains('Daily Report', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Calendar').click();
        cy.contains('Calendars', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Projects').click();
        cy.contains('Manage tasks, projects, and client deliverables.', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Categories').click();
        cy.contains('Categories', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Daily Goals').click();
        cy.contains('Daily Focus Goals', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Customer Care').click();
        cy.contains('Customer Care', { timeout: 10000 }).should('exist');
        cy.contains('Tickets').click();
        cy.contains('Support Tickets', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Team').click();
        cy.contains('Team Efficiency', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Integrations').click();
        cy.contains('App Store', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Live Squad').click();
        cy.contains('Squad', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Settings').click();
        cy.contains('Settings', { timeout: 10000 }).should('exist');

        cy.get('nav').contains('Help & Support').click();
        cy.contains('Help Center', { timeout: 10000 }).should('exist');
    });
});
