export function sanitizeEditorialText( value = '' ) {
	return String( value )
		.replace( /<[^>]*>/g, '' )
		.trim();
}

function normalizePostOverrides( postOverrides = {} ) {
	return postOverrides &&
		typeof postOverrides === 'object' &&
		! Array.isArray( postOverrides )
		? postOverrides
		: {};
}

function normalizePostOverride( postOverride = {} ) {
	const normalizedPostOverride =
		postOverride &&
		typeof postOverride === 'object' &&
		! Array.isArray( postOverride )
			? postOverride
			: {};

	return {
		titleOverride:
			typeof normalizedPostOverride.titleOverride === 'string'
				? normalizedPostOverride.titleOverride
				: '',
		excerptOverride:
			typeof normalizedPostOverride.excerptOverride === 'string'
				? normalizedPostOverride.excerptOverride
				: '',
		imageOverrideId: Number( normalizedPostOverride.imageOverrideId ) || 0,
	};
}

function isPostOverrideEmpty( postOverride = {} ) {
	const normalizedPostOverride = normalizePostOverride( postOverride );

	return (
		! normalizedPostOverride.titleOverride.trim() &&
		! normalizedPostOverride.excerptOverride.trim() &&
		normalizedPostOverride.imageOverrideId === 0
	);
}

export function getPostOverride( postOverrides = {}, postId = 0 ) {
	const normalizedPostId = Number( postId ) || 0;

	if ( ! normalizedPostId ) {
		return normalizePostOverride();
	}

	const normalizedPostOverrides = normalizePostOverrides( postOverrides );

	return normalizePostOverride(
		normalizedPostOverrides[ String( normalizedPostId ) ]
	);
}

export function updatePostOverrides(
	postOverrides = {},
	postId = 0,
	nextPostOverride = {}
) {
	const normalizedPostOverrides = normalizePostOverrides( postOverrides );
	const normalizedPostId = Number( postId ) || 0;

	if ( ! normalizedPostId ) {
		return normalizedPostOverrides;
	}

	const normalizedPostOverride = normalizePostOverride( nextPostOverride );
	const postOverrideKey = String( normalizedPostId );

	const nextPostOverrides = {
		...normalizedPostOverrides,
	};

	if ( isPostOverrideEmpty( normalizedPostOverride ) ) {
		delete nextPostOverrides[ postOverrideKey ];
	} else {
		nextPostOverrides[ postOverrideKey ] = normalizedPostOverride;
	}

	return nextPostOverrides;
}
