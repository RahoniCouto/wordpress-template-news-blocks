import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

const NEWS_SECTION_SLOT_COUNT = 4;

function normalizePostIds( postIds = [], limit = null ) {
	const normalizedPostIds = postIds.map(
		( postId ) => Number( postId ) || 0
	);

	const uniquePostIds = [ ...new Set( normalizedPostIds ) ];

	if ( limit === null ) {
		return uniquePostIds;
	}

	return uniquePostIds.slice( 0, limit );
}

function normalizeSlotPostIds( slotPostIds = [] ) {
	return Array.from(
		{ length: NEWS_SECTION_SLOT_COUNT },
		( _, index ) => Number( slotPostIds[ index ] ) || 0
	);
}

function isPostEligible( post, categoryId = 0 ) {
	if ( ! post || post.status !== 'publish' ) {
		return false;
	}

	if ( ! categoryId ) {
		return true;
	}

	const postCategories = Array.isArray( post.categories )
		? post.categories.map( ( termId ) => Number( termId ) )
		: [];

	return postCategories.includes( categoryId );
}

export default function useNewsSectionPosts( {
	categoryId = 0,
	selectionMode = 'automatic',
	slotPostIds = [],
	excludePostIds = [],
} ) {
	const normalizedCategoryId = Number( categoryId ) || 0;

	const normalizedSlotPostIds = useMemo(
		() => normalizeSlotPostIds( slotPostIds ),
		[ slotPostIds ]
	);

	const normalizedExcludedPostIds = useMemo(
		() =>
			normalizePostIds( excludePostIds ).filter(
				( postId ) => postId > 0
			),
		[ excludePostIds ]
	);

	const manualPostIds = useMemo(
		() =>
			normalizePostIds( normalizedSlotPostIds ).filter(
				( postId ) => postId > 0
			),
		[ normalizedSlotPostIds ]
	);

	const automaticQuery = useMemo( () => {
		const query = {
			per_page: NEWS_SECTION_SLOT_COUNT,
			status: 'publish',
			orderby: 'date',
			order: 'desc',
			_fields: 'id,title,status,categories',
		};

		const excludedIds = normalizePostIds( [
			...normalizedExcludedPostIds,
			...manualPostIds,
		] ).filter( ( postId ) => postId > 0 );

		if ( excludedIds.length > 0 ) {
			query.exclude = excludedIds;
		}

		if ( normalizedCategoryId > 0 ) {
			query.categories = [ normalizedCategoryId ];
		}

		return query;
	}, [ normalizedCategoryId, normalizedExcludedPostIds, manualPostIds ] );

	return useSelect(
		( select ) => {
			const core = select( coreStore );

			const excludedPostIdsSet = new Set( normalizedExcludedPostIds );

			const seenManualPostIds = new Set();
			const pendingManualSlots = new Set();

			const resolvedPostIds = [ 0, 0, 0, 0 ];
			const slotSources = [
				'automatic',
				'automatic',
				'automatic',
				'automatic',
			];

			let isResolving = false;

			normalizedSlotPostIds.forEach( ( postId, slotIndex ) => {
				if ( ! postId ) {
					return;
				}

				if ( seenManualPostIds.has( postId ) ) {
					return;
				}

				seenManualPostIds.add( postId );

				if ( excludedPostIdsSet.has( postId ) ) {
					return;
				}

				const entityRecordArgs = [ 'postType', 'post', postId ];

				const post = core.getEntityRecord( ...entityRecordArgs );

				const hasFinishedResolution = core.hasFinishedResolution(
					'getEntityRecord',
					entityRecordArgs
				);

				if ( ! hasFinishedResolution && ! post ) {
					pendingManualSlots.add( slotIndex );
					isResolving = true;
					return;
				}

				if ( ! isPostEligible( post, normalizedCategoryId ) ) {
					return;
				}

				resolvedPostIds[ slotIndex ] = postId;
				slotSources[ slotIndex ] = 'manual';
			} );

			let automaticPosts = [];

			if ( selectionMode === 'automatic' ) {
				const entityRecordsArgs = [
					'postType',
					'post',
					automaticQuery,
				];

				automaticPosts =
					core.getEntityRecords( ...entityRecordsArgs ) || [];

				if (
					! core.hasFinishedResolution(
						'getEntityRecords',
						entityRecordsArgs
					)
				) {
					isResolving = true;
				}

				const automaticQueue = automaticPosts.filter(
					( post ) => ! resolvedPostIds.includes( Number( post.id ) )
				);

				resolvedPostIds.forEach( ( postId, slotIndex ) => {
					if ( postId || pendingManualSlots.has( slotIndex ) ) {
						return;
					}

					const nextPost = automaticQueue.shift();

					if ( ! nextPost ) {
						return;
					}

					resolvedPostIds[ slotIndex ] = Number( nextPost.id );

					slotSources[ slotIndex ] = 'automatic';
				} );
			}

			const automaticPostsById = new Map(
				automaticPosts.map( ( post ) => [ Number( post.id ), post ] )
			);

			const resolvedPosts = resolvedPostIds.map( ( postId ) => {
				if ( ! postId ) {
					return null;
				}

				if ( automaticPostsById.has( postId ) ) {
					return automaticPostsById.get( postId );
				}

				return core.getEntityRecord( 'postType', 'post', postId );
			} );

			return {
				resolvedPostIds,
				resolvedPosts,
				slotSources,
				isResolving,
			};
		},
		[
			automaticQuery,
			normalizedCategoryId,
			normalizedExcludedPostIds,
			normalizedSlotPostIds,
			selectionMode,
		]
	);
}
