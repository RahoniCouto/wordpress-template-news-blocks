import { ComboboxControl, Spinner } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDebounce } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';

function getCategoryLabel(category) {
	if (!category?.name) {
		return __('Categoria sem nome', 'wordpress-template-news-blocks');
	}

	return decodeEntities(category.name);
}

export default function CategoryPicker({
	value = 0,
	onChange,
	label,
	help,
}) {
	const [searchTerm, setSearchTerm] = useState('');

	const updateSearchTerm = useDebounce((nextSearchTerm) => {
		setSearchTerm(nextSearchTerm);
	}, 250);

	const normalizedValue = Number(value) || 0;

	const categoriesQuery = useMemo(
		() => ({
			per_page: 20,
			search: searchTerm,
			hide_empty: false,
			orderby: 'name',
			order: 'asc',
			_fields: 'id,name',
		}),
		[searchTerm]
	);

	const { categories, selectedCategory, isResolving } = useSelect(
		(select) => {
			const core = select(coreStore);

			return {
				categories:
					core.getEntityRecords(
						'taxonomy',
						'category',
						categoriesQuery
					) || [],
				selectedCategory: normalizedValue
					? core.getEntityRecord(
							'taxonomy',
							'category',
							normalizedValue
					  )
					: null,
				isResolving: core.isResolving('getEntityRecords', [
					'taxonomy',
					'category',
					categoriesQuery,
				]),
			};
		},
		[categoriesQuery, normalizedValue]
	);

	const options = [
		{
			value: '0',
			label: __('Sem categoria', 'wordpress-template-news-blocks'),
		},
		...categories.map((category) => ({
			value: String(category.id),
			label: getCategoryLabel(category),
		})),
	];

	if (
		selectedCategory &&
		!options.some(
			(option) => Number(option.value) === normalizedValue
		)
	) {
		options.splice(1, 0, {
			value: String(selectedCategory.id),
			label: getCategoryLabel(selectedCategory),
		});
	}

	return (
		<div className="wtn-blocks-category-picker">
			<ComboboxControl
				label={
					label ||
					__('Categoria da seção', 'wordpress-template-news-blocks')
				}
				value={String(normalizedValue)}
				options={options}
				onChange={(nextValue) => {
					onChange(nextValue ? Number(nextValue) : 0);
				}}
				onFilterValueChange={(nextSearchTerm) => {
					updateSearchTerm(nextSearchTerm || '');
				}}
				help={
					help ||
					__(
						'Escolha uma categoria para limitar o conteúdo da seção ou mantenha sem categoria para usar qualquer matéria.',
						'wordpress-template-news-blocks'
					)
				}
			/>

			{isResolving && (
				<div className="wtn-blocks-category-picker__loading">
					<Spinner />
				</div>
			)}
		</div>
	);
}
