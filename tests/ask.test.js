const request = require('supertest');
const app = require('../server');

// Mock the Gemini API so we don't make real network calls during tests
jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => {
            return {
                getGenerativeModel: jest.fn().mockReturnValue({
                    generateContent: jest.fn().mockResolvedValue({
                        response: {
                            text: () => "Mocked Gemini Response: Head to Gate 4."
                        }
                    })
                })
            };
        })
    };
});

describe('GateWise API Tests', () => {
    
    // Set a dummy API key for testing so the validation passes
    beforeAll(() => {
        process.env.GEMINI_API_KEY = 'dummy-test-key';
    });

    describe('POST /api/ask', () => {
        it('should return 400 if required fields are missing', async () => {
            const res = await request(app).post('/api/ask').send({
                // missing gateId
                language: 'English',
                need: 'Restrooms'
            });
            expect(res.statusCode).toBe(400);
            expect(res.body.error).toContain('Missing required fields');
        });

        it('should return 404 if an invalid gateId is provided', async () => {
            const res = await request(app).post('/api/ask').send({
                gateId: 'invalid-gate',
                language: 'English',
                need: 'Restrooms',
                accessibility: false
            });
            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Gate not found in stadium data.');
        });

        it('should successfully call the mocked Gemini API and return a recommendation', async () => {
            const res = await request(app).post('/api/ask').send({
                gateId: 'gate-1',
                language: 'English',
                need: 'Food',
                accessibility: true
            });
            
            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.recommendation).toBe("Mocked Gemini Response: Head to Gate 4.");
        });
    });

    describe('GET /api/volunteer/data', () => {
        it('should return stadium data and recent requests log', async () => {
            const res = await request(app).get('/api/volunteer/data');
            
            expect(res.statusCode).toBe(200);
            expect(res.body.stadiumData).toBeDefined();
            expect(res.body.stadiumData.length).toBeGreaterThan(0);
            expect(res.body.stadiumData[0].id).toBe('gate-1');
            
            expect(res.body.recentRequests).toBeDefined();
            expect(Array.isArray(res.body.recentRequests)).toBe(true);
            // Since we made a successful POST request above, the log should have at least 1 entry
            expect(res.body.recentRequests.length).toBeGreaterThan(0);
        });
    });
});
