// 分頁元件
function Pagination({ pagination , onChangePage}) {
    const handClick = ( e , page) => {
        e.preventDefault()
        onChangePage(page)
    }

    return(
    <nav aria-label="Page navigation example">
        {/* {JSON.stringify(pagination)} 檢查有沒有傳入資料*/}
    <ul class="pagination justify-content-center">
        <li class={`page-item ${!pagination.has_pre && "disabled"}`}>
        <a class="page-link" href="#" aria-label="Previous" onClick={(e) => handClick(e, pagination.current_page - 1)}>
            <span aria-hidden="true">&laquo;</span>
        </a>
        </li>
        {
            Array.from({length: pagination.total_pages},( _ , index ) => (
                <li class={`page-item ${pagination.current_page === index + 1 && "active"}`} key={`${index}_page`}>
                    <a class="page-link" href="#" onClick={(e) => handClick(e, index + 1)}>
                        {index + 1}
                    </a>
                </li>
            ))
        }
        <li class={`page-item ${!pagination.has_next && "disabled"}`}>
        <a class="page-link" href="#" aria-label="Next" onClick={(e) => handClick(e, pagination.current_page + 1)}>
            <span aria-hidden="true">&raquo;</span>
        </a>
        </li>
    </ul>
    </nav>
    )
}

export default Pagination;