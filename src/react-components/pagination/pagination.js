import React from "react";
import "./pagination.scss";
import { FaEllipsisH as IconMore, FaChevronLeft as IconPrevious, FaChevronRight  as IconNext , FaAngleDoubleLeft as IconPreviousDouble,  FaAngleDoubleRight as IconNextDouble} from "react-icons/fa"

const Pagination = props => {
	const { pagination, callFetchList } = props;

	const changePage = (page) => {
		if (page < 1 || page > pagination.totalPage) {
			return;
		}
		if (page === pagination.currentPage) return;
		callFetchList(page);
	};

	const firstPage = () => {
        if(pagination.currentPage === 1) return;
        changePage(1);
    }

	const nextPage = () => {
        if(pagination.currentPage === pagination.totalPage) return;
        changePage(pagination.currentPage + 1);
    }

    const prePage = () => {
        if(pagination.currentPage === 1) return;
        changePage(pagination.currentPage - 1);
    }

    const lastPage = () => {
        if(pagination.currentPage === pagination.totalPage) return;
        changePage(pagination.totalPage);
    }

    const setMorePagePrev = () => {
        // if(pagination.currentPage) return;
        changePage(pagination.currentPage - 2);
    }

	const setMorePageNext = () => {
        // if(pagination.currentPage) return;
        changePage(pagination.currentPage + 2);
    }

	const renderPageSetting = () => {
		if (!pagination) {
			return <></>;
		};

		const elements = [];

		// "<<"
		elements.push(
			<div key={'double-prev'} className={'double double-prev' + (pagination.currentPage <= 1 ? ' event-none' : '')} onClick={()=>{changePage(1)}}>
				<IconPreviousDouble className="ico" />
			</div>
		)
		// "<"
		elements.push(
			<div key={'single-prev'}  className={'single single-prev' + (pagination.currentPage <= 1 ? ' event-none' : '')} onClick={() => prePage()}>
				<IconPrevious className="ico" />
			</div>
		)

		// page numbers
		for (let i = pagination.beginPage; i <= pagination.endPage; i++) {
			elements.push(
				<div key={'page-'+i} className={(i < pagination.currentPage ? 'pre-page' : (i >  pagination.currentPage ? 'next-page' : 'current-page'))} onClick={i === pagination.currentPage ? null : () => changePage(i)}>
					<span>{i}</span>
				</div>
			);
		}

		// ">"
		elements.push(
			<div key={'single-next'} className={'single single-next' + (pagination.currentPage >= pagination.totalPage ? ' event-none' : '')}  onClick={() => nextPage()}>
				<IconNext className="ico" />
			</div>
		)
		// ">>"
		elements.push(
			<div key={'double-next'}  className={'double double-next' + (pagination.currentPage >= pagination.totalPage ? ' event-none' : '')} onClick={()=>{changePage(pagination.totalPage)}}>
				<IconNextDouble className="ico" />
			</div>
		)

		return elements;
	};

	return (
		<div className="WRAP_PAGINATION d-flex align-items-center justify-content-center">
			{renderPageSetting()}
		</div>
	)
};

export default Pagination;
