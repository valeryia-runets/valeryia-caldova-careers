import { describe, it, expect } from 'vitest';
import { sortByNewest, formatPostedDate, getDepartments, getLocations, filterJobs } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});

/**
 * Build a job fixture with a specific department and location.
 *
 * @param slug - Job slug.
 * @param department - Department name.
 * @param location - Location name.
 * @returns A complete `Job` fixture.
 */
function makeRole(slug: string, department: string, location: string): Job {
    return { ...makeJob(slug, '2027-01-01'), department, location };
}

describe('role filters', () => {
    const jobs = [
        makeRole('a', 'Finance', 'Chicago'),
        makeRole('b', 'Finance', 'London'),
        makeRole('c', 'Sales', 'London'),
        makeRole('d', 'Technology', 'Remote'),
    ];
    const none = { departments: [], locations: [] };
    /** Extract slugs so assertions stay readable. */
    const slugs = (list: Job[]): string[] => list.map((job) => job.slug);

    it('lists unique sorted departments and locations', () => {
        expect(getDepartments(jobs)).toEqual(['Finance', 'Sales', 'Technology']);
        expect(getLocations(jobs)).toEqual(['Chicago', 'London', 'Remote']);
    });

    it('filters by department only, matching any selected value', () => {
        expect(slugs(filterJobs(jobs, { ...none, departments: ['Finance'] }))).toEqual(['a', 'b']);
        expect(slugs(filterJobs(jobs, { ...none, departments: ['Sales', 'Technology'] }))).toEqual(['c', 'd']);
    });

    it('filters by location only', () => {
        expect(slugs(filterJobs(jobs, { ...none, locations: ['London'] }))).toEqual(['b', 'c']);
    });

    it('combines department and location with AND', () => {
        expect(
            slugs(filterJobs(jobs, { departments: ['Finance'], locations: ['London'] })),
        ).toEqual(['b']);
    });

    it('returns every job when filters are reset', () => {
        expect(filterJobs(jobs, none)).toEqual(jobs);
    });

    it('returns an empty array when nothing matches', () => {
        expect(filterJobs(jobs, { departments: ['Sales'], locations: ['Chicago'] })).toEqual([]);
        expect(filterJobs(jobs, { ...none, departments: ['Unknown'] })).toEqual([]);
    });
});
