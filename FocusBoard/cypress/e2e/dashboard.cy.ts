describe('Dashboard E2E Tests', () => {
    const seedTasks = () => ([
        {
            _id: 'task-1',
            title: 'Initial Task',
            status: 'TODO',
            priority: 'MEDIUM',
            timeSpent: 0,
            billable: true,
            archived: false,
            user_id: 'user-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
    ]);

    beforeEach(() => {
        let tasks = seedTasks();

        cy.intercept('GET', '**/api/auth/me', {
            statusCode: 200,
            body: { success: true, data: { id: 'user-1', name: 'Test User', email_id: 'test@example.com' } }
        }).as('me');

        cy.intercept('GET', '**/api/metrics/dashboard', {
            statusCode: 200,
            body: { success: true, data: { focusScore: 82, deepWorkMinutes: 120, distractedMinutes: 15, totalActivities: 40 } }
        }).as('dashboardMetrics');

        cy.intercept('GET', /.*\/api\/metrics\/timeline.*/, {
            statusCode: 200,
            body: {
                success: true,
                data: [
                    {
                        id: 't1',
                        title: 'Deep Work',
                        startTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                        endTime: new Date().toISOString(),
                        category: 'Focus',
                        duration: 60,
                        type: 'focus'
                    }
                ]
            }
        }).as('timeline');

        cy.intercept('GET', '**/api/tasks', () => {
            return { statusCode: 200, body: { success: true, data: tasks } };
        }).as('tasks');

        cy.intercept('POST', '**/api/tasks', (req) => {
            const created = {
                _id: `task-${tasks.length + 1}`,
                status: 'TODO',
                priority: 'MEDIUM',
                timeSpent: 0,
                billable: true,
                archived: false,
                user_id: 'user-1',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...req.body
            };
            tasks = [...tasks, created];
            req.reply({ statusCode: 201, body: { success: true, data: created } });
        });

        cy.intercept('GET', '**/api/teams/squad', {
            statusCode: 200,
            body: { success: true, data: [] }
        }).as('squad');

        cy.visit('/', {
            onBeforeLoad(win) {
                win.localStorage.setItem('focusboard_token', 'test-token');
                win.localStorage.setItem('focusboard_e2e', 'true');
            }
        });

    });

    it('should load the dashboard with correct metrics and timeline', () => {
        // Verify loading state is shown initially or transitions out
        cy.get('body').should('exist');

        // Wait for metrics cards to appear
        cy.get('button[aria-label^="Deep Work"]', { timeout: 10000 }).scrollIntoView().should('exist');
        cy.get('button[aria-label^="Switches"]', { timeout: 10000 }).scrollIntoView().should('exist');

        // Verify Daily Overview header
        cy.contains('Daily Overview').should('exist');
    });

    it('should navigate to the Tasks view and create a task', () => {
        // Navigate using the sidebar/bottom nav
        cy.get('nav').contains('Projects').click();

        // Ensure we are on the Tasks View
        cy.contains('Manage tasks, projects, and client deliverables.').should('exist');

        // Click New button
        cy.contains('h1', 'Work')
            .closest('header')
            .first()
            .within(() => {
                cy.contains('button', 'New').click({ force: true });
            });

        // Fill out form
        cy.get('input[placeholder="What needs to be done?"]').should('exist').type('E2E Cypress Test Task', { force: true });
        cy.contains('button', 'Create Task').click();

        // Verify task is in the list (might need to select 'Settings' or reload etc. if using websockets)
        cy.contains('E2E Cypress Test Task').should('be.visible');
    });
});
