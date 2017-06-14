'use strict';

import { handleGithubHook } from './lib/github'

import * as url from 'url'

import {
	Headers,
	Timing,
	GitHubExtra,
	Result,
} from './lib/types'


export async function getDoc(
	source: string,
	extra: GitHubExtra,
	headers: Headers,
	body: Buffer | string
): Promise< Result >
{
	const parsedUrl = url.parse( source );

	const host = parsedUrl.hostname;

	if ( host === 'github.com' )
	{
		const githubExtra = < GitHubExtra >extra;
		return handleGithubHook(
			source,
			githubExtra.secret,
			githubExtra.events || [ 'push' ],
			githubExtra.branches,
			githubExtra.path || '',
			headers,
			body );
	}

	throw new Error( `Source "${source}" not supported` );
}
