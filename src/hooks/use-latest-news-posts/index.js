import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

function normalizePostCount( postCount = 4 ) {
	const normalizedPostCount = Number( postCount ) || 0;

	return [ 3, 4, 5 ].includes( normalizedPostCount )
		? normalizedPostCount
		: 4;
}

function normalizePostIds( postIds = [] ) {
	if ( ! Array.isArray( postIds ) ) {
		return [];
	}

	return [
		...new Set(
			postIds
				.map( ( postId ) => Number( postId ) || 0 )
				.filter( ( postId ) => postId > 0 )
		),
	];
}

function sortPostsByDateAndId( posts = [] ) {
	return [ ...posts ].sort( ( firstPost, secondPost ) => {
		const firstDate =
			typeof firstPost?.date === 'string' ? firstPost.date : '';

		const secondDate =
			typeof secondPost?.date === 'string' ? secondPost.date : '';

		if ( firstDate !== secondDate ) {
			return firstDate < secondDate ? 1 : -1;
		}

		const firstPostId = Number( firstPost?.id ) || 0;
		const secondPostId = Number( secondPost?.id ) || 0;

		return secondPostId - firstPostId;
	} );
}

export default function useLatestNewsPosts( {
	categoryId = 0,
	postCount = 4,
	excludePostIds = [],
} ) {
	const normalizedCategoryId = Number( categoryId ) || 0;
	const normalizedPostCount = normalizePostCount( postCount );

	const normalizedExcludedPostIds = useMemo(
		() => normalizePostIds( excludePostIds ),
		[ excludePostIds ]
	);

	const latestNewsQuery = useMemo( () => {
		const query = {
			per_page: normalizedPostCount,
			status: 'publish',
			orderby: 'date',
			order: 'desc',
			_fields: 'id,title,featured_media,status,categories,date,link',
		};

		if ( normalizedExcludedPostIds.length > 0 ) {
			query.exclude = normalizedExcludedPostIds;
		}

		if ( normalizedCategoryId > 0 ) {
			query.categories = [ normalizedCategoryId ];
		}

		return query;
	}, [
		normalizedCategoryId,
		normalizedExcludedPostIds,
		normalizedPostCount,
	] );

	return useSelect(
		( select ) => {
			const core = select( coreStore );
			const entityRecordsArgs = [ 'postType', 'post', latestNewsQuery ];

			const queriedPosts =
				core.getEntityRecords( ...entityRecordsArgs ) || [];

			const isResolving = ! core.hasFinishedResolution(
				'getEntityRecords',
				entityRecordsArgs
			);

			const resolvedPosts = sortPostsByDateAndId( queriedPosts ).slice(
				0,
				normalizedPostCount
			);

			return {
				resolvedPostIds: resolvedPosts
					.map( ( post ) => Number( post.id ) || 0 )
					.filter( ( postId ) => postId > 0 ),
				resolvedPosts,
				isResolving,
			};
		},
		[ latestNewsQuery, normalizedPostCount ]
	);
}
