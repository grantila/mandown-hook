'use strict';

import * as crypto from "crypto";

import * as del from 'del'
import * as execa from 'execa'

import { parse } from 'mandown'

import { timePromise } from './utils'

import {
	Headers,
	Timing,
	GitHubExtra,
	Result,
} from './types'


const reBranchFromRef = /^refs\/heads\/(.+)$/;
const repoDir = "/tmp/repo";

export function validatePayload(
	signature: string,
	payload: string | Buffer,
	secret: string
): boolean
{
	const sha1 = crypto
		.createHmac( "sha1", secret )
		.update( payload )
		.digest( "hex" );
	const sig = `sha1=${sha1}`;
	return crypto.timingSafeEqual(
		Buffer.from( signature ), Buffer.from( sig ) );
}

export interface GithubPayload
{
	event: string;
	payload: any;
}

export function parseGithubHook(
	secret: string,
	headers: { [ key: string ]: string; },
	body: string | Buffer
): GithubPayload
{
	const signature = headers[ 'x-hub-signature' ];
	const event = headers[ 'x-github-event' ];

	if ( !validatePayload( signature, body, secret ) )
	{
		console.error( "Github payload validation failed" );
		return null;
	}

	try
	{
		const payload = JSON.parse( body.toString( ) );
		return { event, payload };
	}
	catch ( err )
	{
		console.error( "Couldn't parse github data", err );
		return null;
	}
}

export async function handleGithubHook(
	source: string,
	secret: string,
	events: string[],
	branches: string[],
	path: string,
	headers: Headers,
	body: string | Buffer
): Promise< Result >
{
	const timings: Timing[] = [ ];

	const hook = parseGithubHook( secret, headers, body );

	const { event, payload } = hook;

	const branch = ( payload.ref || '' ).match( reBranchFromRef )[ 1 ];

	if ( !events.includes( event ) )
		return { completion: 'ignored-event', timings, branch, event };

	if ( !branches.includes( branch ) )
		return { completion: 'ignored-branch', timings, branch, event };;

	const performTiming = < T >( job: string, prom: Promise< T > ) =>
		timePromise( time => { timings.push( { job, time } ); }, prom );

	await performTiming( "cleanup", del( repoDir, { force: true } ) );

	const args = [
		"clone", "--depth", "1", "--branch", branch, source, repoDir
	];
	await performTiming( "cloning", execa( "git", args ) );

	const dir = `${repoDir}/${path}`.replace( /\/\//g, '/' );

	const doc = await performTiming( "parsing", parse( dir ) );

	return { completion: 'ok', timings, branch, event, doc };
}
