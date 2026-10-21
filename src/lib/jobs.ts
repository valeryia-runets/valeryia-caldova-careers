/**
 * Pure, side-effect-free helpers for working with job postings.
 *
 * These operate on plain `Job[]` arrays (already loaded from the content
 * collection by the calling page) so they can be unit tested without the Astro
 * content runtime or a database.
 */
import type { Job } from '../types/job';

/** Return jobs sorted by posted date, newest first (does not mutate input). */
export function sortByNewest(jobs: Job[]): Job[] {
    return [...jobs].sort(
        (a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(),
    );
}

/**
 * Format an ISO-8601 date as a human-readable posted date,
 * e.g. "January 5, 2027". Falls back to the raw value if unparseable.
 */
export function formatPostedDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return iso;
    }
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    });
}

/** Selected filter values; an empty array means "no constraint". */
export interface RoleFilters {
    /** Selected departments; a job matches if its department is any of these. */
    departments: string[];
    /** Selected locations; a job matches if its location is any of these. */
    locations: string[];
}

/**
 * Return the unique departments, sorted alphabetically.
 *
 * @param jobs - Jobs to read departments from.
 * @returns Distinct department names.
 */
export function getDepartments(jobs: Pick<Job, 'department'>[]): string[] {
    return [...new Set(jobs.map((job) => job.department))].sort((a, b) => a.localeCompare(b));
}

/**
 * Return the unique locations, sorted alphabetically.
 *
 * @param jobs - Jobs to read locations from.
 * @returns Distinct location names.
 */
export function getLocations(jobs: Pick<Job, 'location'>[]): string[] {
    return [...new Set(jobs.map((job) => job.location))].sort((a, b) => a.localeCompare(b));
}

/**
 * Filter jobs by department and location. Values within one filter combine
 * with OR; the two filters combine with AND. Empty selections match everything.
 *
 * @param jobs - Jobs (or job-like objects) to filter; not mutated.
 * @param filters - Selected departments and locations.
 * @returns The jobs matching every active filter, in their original order.
 */
export function filterJobs<T extends Pick<Job, 'department' | 'location'>>(
    jobs: T[],
    filters: RoleFilters,
): T[] {
    return jobs.filter(
        (job) =>
            (filters.departments.length === 0 || filters.departments.includes(job.department)) &&
            (filters.locations.length === 0 || filters.locations.includes(job.location)),
    );
}
