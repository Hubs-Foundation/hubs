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
		if (!pagination) return;
		const listPageElement = [];
		if (pagination.totalPage > 4) {
			// if (pagination.prevPage !== 0 && pagination.prevPage - 1 >= 2) {
			// 	listPageElement.push(
			// 		<div className="first-page" onClick={() => changePage(1)}>
			// 			<span>1</span>
			// 		</div>
			// 	);
			// }
			if (pagination.hasPrevPage == true ) {
				listPageElement.push(
					<div className="more" onClick={() => setMorePagePrev()}>
						<IconMore className="ico-more" />
					</div>
				);
			}
			if (pagination.prevPage !== null) {
				listPageElement.push(
					<div className="pre-page" onClick={() => changePage(pagination.prevPage)}>
						<span>{pagination.prevPage}</span>
					</div>
				);
			}
			
			listPageElement.push(
				<div className="current-page">
					<span>{pagination.currentPage}</span>
				</div>
			);

			if (pagination.nextPage !== null) {
				listPageElement.push(
					<div className="next-page" onClick={() => changePage(pagination.nextPage)}>
						<span>{pagination.nextPage}</span>
					</div>
				);
			}
			if (pagination.hasNextPage == true) {
				listPageElement.push(
					<div className="more" onClick={() => setMorePageNext()}>
						<IconMore className="ico-more" />
					</div>
				);
				
			}
			// if (pagination.nextPage !== 0 && pagination.totalPage - pagination.nextPage >= 2) {
			// 	listPageElement.push(
			// 		<div className="last-page" onClick={() => changePage(pagination.totalPage)}>
			// 			<span>{pagination.totalPage}</span>
			// 		</div>
			// 	);
			// }
		} else {
			for (let i = 1; i <= pagination.totalPage; i++) {
				listPageElement.push(
					<div className={i == pagination.currentPage ? "current-page" : "next-page"} onClick={i === pagination.currentPage ? null : () => changePage(i)} key={i}>
						<span>{i}</span>
					</div>
				);
			}
		}
		return listPageElement;
	};

	return (
		<div className="WRAP_PAGINATION d-flex align-items-center justify-content-center">
			<div className={pagination.currentPage == 1 ? 'double double-prev event-none':'double double-prev'} onClick={() => firstPage()}>
				<IconPreviousDouble className="ico" />
			</div>
			<div className={pagination.currentPage == 1 ? 'single single-prev event-none':'single single-prev'} onClick={() => prePage()}>
				<IconPrevious className="ico" />
			</div>

			{renderPageSetting()}

			<div className={pagination.currentPage == pagination.totalPage ? 'single single-next event-none':'single single-next'}  onClick={() => nextPage()}>
				<IconNext className="ico" />
			</div>

			<div className={pagination.currentPage == pagination.totalPage ? 'double double-next event-none':'double double-next'} onClick={() => lastPage()}>
				<IconNextDouble className="ico" />
			</div>
		</div>
	);
};

export default Pagination;
