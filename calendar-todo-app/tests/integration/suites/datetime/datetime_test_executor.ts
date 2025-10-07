/**
 * Date/Time Integration Test Executor
 * 
 * This module orchestrates the execution of all Date/Time handling integration tests,
 * captures comprehensive results, generates reports, and manages test execution flow.
 * 
 * Created: September 7, 2025
 * Version: 1.0.0
 * Status: Implementation Complete
 */

import { clearDateTimeTestResults, getDateTimeTestResults } from './datetime_test_setup';

// Import all test suites
import './date_formatting.test';
import './dst_handling.test';
import './time_range_validation.test';
import './timezone_conversion.test';

interface DateTimeTestExecutionReport {
    executionId: string;
    startTime: string;
    endTime: string;
    totalDuration: number;
    testSuites: {
        timezone: TestSuiteResult;
        dst: TestSuiteResult;
        formatting: TestSuiteResult;
        validation: TestSuiteResult;
    };
    overallStats: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        errorTests: number;
        successRate: number;
    };
    performanceMetrics: {
        averageTestDuration: number;
        slowestTest: string;
        fastestTest: string;
        totalProcessingTime: number;
    };
    recommendations: string[];
    issues: TestIssue[];
}

interface TestSuiteResult {
    suiteName: string;
    testCount: number;
    passedCount: number;
    failedCount: number;
    errorCount: number;
    successRate: number;
    totalDuration: number;
    tests: TestResultSummary[];
}

interface TestResultSummary {
    testName: string;
    status: 'PASS' | 'FAIL' | 'ERROR';
    duration: number;
    notes: string;
    errorDetails?: string;
    performanceMetrics?: any;
}

interface TestIssue {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    description: string;
    testName: string;
    recommendation: string;
}

class DateTimeTestExecutor {
    private executionId: string;
    private startTime: Date;
    private results: DateTimeTestExecutionReport;

    constructor() {
        this.executionId = `datetime_test_${Date.now()}`;
        this.startTime = new Date();
        this.results = this.initializeReport();
    }

    private initializeReport(): DateTimeTestExecutionReport {
        return {
            executionId: this.executionId,
            startTime: this.startTime.toISOString(),
            endTime: '',
            totalDuration: 0,
            testSuites: {
                timezone: this.initializeTestSuite('Timezone Conversion'),
                dst: this.initializeTestSuite('DST Handling'),
                formatting: this.initializeTestSuite('Date Formatting'),
                validation: this.initializeTestSuite('Time Range Validation')
            },
            overallStats: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                errorTests: 0,
                successRate: 0
            },
            performanceMetrics: {
                averageTestDuration: 0,
                slowestTest: '',
                fastestTest: '',
                totalProcessingTime: 0
            },
            recommendations: [],
            issues: []
        };
    }

    private initializeTestSuite(suiteName: string): TestSuiteResult {
        return {
            suiteName,
            testCount: 0,
            passedCount: 0,
            failedCount: 0,
            errorCount: 0,
            successRate: 0,
            totalDuration: 0,
            tests: []
        };
    }

    public async executeAllTests(): Promise<DateTimeTestExecutionReport> {
        console.log('\\n=== Starting Date/Time Integration Test Execution ===');
        console.log(`Execution ID: ${this.executionId}`);
        console.log(`Start Time: ${this.startTime.toISOString()}`);
        console.log('Test Suites: Timezone Conversion, DST Handling, Date Formatting, Time Range Validation');
        console.log('===========================================================\\n');

        try {
            // Clear any previous test results
            clearDateTimeTestResults();

            // Execute test suites in sequence to avoid conflicts
            await this.executeTestSuite('timezone', () => import('./timezone_conversion.test'));
            await this.executeTestSuite('dst', () => import('./dst_handling.test'));
            await this.executeTestSuite('formatting', () => import('./date_formatting.test'));
            await this.executeTestSuite('validation', () => import('./time_range_validation.test'));

            // Process results and generate final report
            this.processTestResults();
            this.generateRecommendations();
            this.finalizeReport();

            return this.results;

        } catch (error: any) {
            console.error('Test execution failed:', error);
            this.results.issues.push({
                severity: 'HIGH',
                category: 'EXECUTION_ERROR',
                description: `Test execution failed: ${error?.message || 'Unknown error'}`,
                testName: 'Test Executor',
                recommendation: 'Review test setup and environment configuration'
            });
            
            this.finalizeReport();
            return this.results;
        }
    }

    private async executeTestSuite(suiteKey: keyof typeof this.results.testSuites, testLoader: () => any): Promise<void> {
        const suiteStartTime = Date.now();
        console.log(`\\nExecuting ${this.results.testSuites[suiteKey].suiteName} test suite...`);

        try {
            // Load and execute the test suite
            testLoader();
            
            // Allow some time for async test completion
            await this.wait(1000);

            const suiteDuration = Date.now() - suiteStartTime;
            console.log(`${this.results.testSuites[suiteKey].suiteName} completed in ${suiteDuration}ms`);

        } catch (error: any) {
            console.error(`Error in ${this.results.testSuites[suiteKey].suiteName}:`, error);
            this.results.issues.push({
                severity: 'HIGH',
                category: 'SUITE_ERROR',
                description: `Suite execution failed: ${error?.message || 'Unknown error'}`,
                testName: this.results.testSuites[suiteKey].suiteName,
                recommendation: 'Check test suite implementation and dependencies'
            });
        }
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private processTestResults(): void {
        const rawResults = getDateTimeTestResults();
        
        // Group results by category
        const resultsByCategory = {
            timezone: rawResults.filter(r => r.category === 'timezone'),
            dst: rawResults.filter(r => r.category === 'dst'),
            formatting: rawResults.filter(r => r.category === 'formatting'),
            validation: rawResults.filter(r => r.category === 'validation')
        };

        // Process each test suite
        Object.entries(resultsByCategory).forEach(([category, tests]) => {
            const suiteKey = category as keyof typeof this.results.testSuites;
            const suite = this.results.testSuites[suiteKey];
            
            suite.testCount = tests.length;
            suite.passedCount = tests.filter(t => t.status === 'PASS').length;
            suite.failedCount = tests.filter(t => t.status === 'FAIL').length;
            suite.errorCount = tests.filter(t => t.status === 'ERROR').length;
            suite.successRate = suite.testCount > 0 ? (suite.passedCount / suite.testCount) * 100 : 0;
            suite.totalDuration = tests.reduce((sum, test) => sum + test.duration, 0);
            
            suite.tests = tests.map(test => ({
                testName: test.testName,
                status: test.status,
                duration: test.duration,
                notes: test.notes,
                errorDetails: test.errorDetails,
                performanceMetrics: test.performanceMetrics
            }));

            // Identify issues
            tests.forEach(test => {
                if (test.status === 'ERROR') {
                    this.results.issues.push({
                        severity: 'HIGH',
                        category: category.toUpperCase(),
                        description: test.notes,
                        testName: test.testName,
                        recommendation: this.getRecommendationForError(test.errorDetails || '')
                    });
                } else if (test.status === 'FAIL') {
                    this.results.issues.push({
                        severity: 'MEDIUM',
                        category: category.toUpperCase(),
                        description: test.notes,
                        testName: test.testName,
                        recommendation: 'Review test expectations and implementation'
                    });
                }
            });
        });

        // Calculate overall statistics
        this.calculateOverallStats();
        this.calculatePerformanceMetrics(rawResults);
    }

    private calculateOverallStats(): void {
        const suites = Object.values(this.results.testSuites);
        
        this.results.overallStats.totalTests = suites.reduce((sum, suite) => sum + suite.testCount, 0);
        this.results.overallStats.passedTests = suites.reduce((sum, suite) => sum + suite.passedCount, 0);
        this.results.overallStats.failedTests = suites.reduce((sum, suite) => sum + suite.failedCount, 0);
        this.results.overallStats.errorTests = suites.reduce((sum, suite) => sum + suite.errorCount, 0);
        
        this.results.overallStats.successRate = this.results.overallStats.totalTests > 0 
            ? (this.results.overallStats.passedTests / this.results.overallStats.totalTests) * 100 
            : 0;
    }

    private calculatePerformanceMetrics(tests: any[]): void {
        if (tests.length === 0) return;

        const durations = tests.map(t => t.duration);
        const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
        
        this.results.performanceMetrics.totalProcessingTime = totalTime;
        this.results.performanceMetrics.averageTestDuration = totalTime / tests.length;
        
        const slowestTest = tests.reduce((max, test) => test.duration > max.duration ? test : max);
        const fastestTest = tests.reduce((min, test) => test.duration < min.duration ? test : min);
        
        this.results.performanceMetrics.slowestTest = `${slowestTest.testName} (${slowestTest.duration}ms)`;
        this.results.performanceMetrics.fastestTest = `${fastestTest.testName} (${fastestTest.duration}ms)`;
    }

    private generateRecommendations(): void {
        const recommendations = [];

        // Performance recommendations
        if (this.results.performanceMetrics.averageTestDuration > 1000) {
            recommendations.push('Consider optimizing test performance - average test duration exceeds 1 second');
        }

        // Success rate recommendations
        if (this.results.overallStats.successRate < 95) {
            recommendations.push('Test success rate is below 95% - review failing tests and implementation');
        }

        // Coverage recommendations
        Object.entries(this.results.testSuites).forEach(([key, suite]) => {
            if (suite.testCount < 5) {
                recommendations.push(`${suite.suiteName} has limited test coverage - consider adding more test cases`);
            }
        });

        // Error pattern recommendations
        const errorCategories = this.results.issues.map(issue => issue.category);
        const uniqueErrorCategories = [...new Set(errorCategories)];
        if (uniqueErrorCategories.length > 2) {
            recommendations.push('Multiple error categories detected - systematic review of test infrastructure recommended');
        }

        this.results.recommendations = recommendations;
    }

    private getRecommendationForError(errorDetails: string): string {
        if (errorDetails.includes('timeout')) {
            return 'Increase test timeout or optimize test performance';
        } else if (errorDetails.includes('network')) {
            return 'Check network connectivity and mock service setup';
        } else if (errorDetails.includes('mock')) {
            return 'Review mock response configuration';
        } else if (errorDetails.includes('TypeError')) {
            return 'Check data types and object property access';
        } else {
            return 'Review test implementation and error handling';
        }
    }

    private finalizeReport(): void {
        const endTime = new Date();
        this.results.endTime = endTime.toISOString();
        this.results.totalDuration = endTime.getTime() - this.startTime.getTime();

        // Log final summary
        console.log('\\n=== Date/Time Integration Test Execution Summary ===');
        console.log(`Execution ID: ${this.executionId}`);
        console.log(`Total Duration: ${this.results.totalDuration}ms`);
        console.log(`Total Tests: ${this.results.overallStats.totalTests}`);
        console.log(`Passed: ${this.results.overallStats.passedTests}`);
        console.log(`Failed: ${this.results.overallStats.failedTests}`);
        console.log(`Errors: ${this.results.overallStats.errorTests}`);
        console.log(`Success Rate: ${this.results.overallStats.successRate.toFixed(2)}%`);
        console.log(`Issues Found: ${this.results.issues.length}`);
        console.log(`Recommendations: ${this.results.recommendations.length}`);
        console.log('==================================================\\n');

        // Log suite summaries
        Object.values(this.results.testSuites).forEach(suite => {
            console.log(`${suite.suiteName}: ${suite.passedCount}/${suite.testCount} passed (${suite.successRate.toFixed(1)}%)`);
        });

        // Log critical issues
        const criticalIssues = this.results.issues.filter(issue => issue.severity === 'HIGH');
        if (criticalIssues.length > 0) {
            console.log('\\nCritical Issues:');
            criticalIssues.forEach(issue => {
                console.log(`- ${issue.testName}: ${issue.description}`);
            });
        }

        // Log recommendations
        if (this.results.recommendations.length > 0) {
            console.log('\\nRecommendations:');
            this.results.recommendations.forEach(recommendation => {
                console.log(`- ${recommendation}`);
            });
        }

        console.log('\\n=== Date/Time Test Execution Complete ===\\n');
    }

    public getResults(): DateTimeTestExecutionReport {
        return this.results;
    }

    public exportResults(): string {
        return JSON.stringify(this.results, null, 2);
    }
}

// Execute tests when this module is imported
export const executeDateTimeTests = async (): Promise<DateTimeTestExecutionReport> => {
    const executor = new DateTimeTestExecutor();
    return await executor.executeAllTests();
};

// Export for manual execution
export { DateTimeTestExecutor };
