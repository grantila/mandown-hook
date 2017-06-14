'use strict';

export type Headers = { [ key: string ]: string; };
export type Timing = { job: string; time: number; };

export interface GitHubExtra
{
	secret: string;
	path?: string;     // Path in the repo where the documentation is
	events?: string[]; // Defaults to [ 'push' ]
	branches: string[];
}

export interface Result
{
	event: string;
	branch: string;
	timings: Timing[];
	completion: 'ok' | 'ignored-branch' | 'ignored-event';
	doc?: any; // JSON data
}
