'use strict';

export function timePromise< T >(
	timeFn: ( number ) => void,
	promise: Promise< T >
): Promise< T >
{
	const start = Date.now( );
	const end = ( ) =>
		timeFn( Date.now( ) - start );

	return promise
	.then(
		value => { end( ); return value; },
		err => { end( ); throw err; }
	);
}
