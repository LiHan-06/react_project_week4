// 產品Modal元件
import { useEffect, useState } from 'react';
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function ProductModal({
    modalType,
    templateProduct,
    getProducts,
    closeModal,
    errors,
}) {
  const [tempData,setTempData] = useState(templateProduct); //建立新的tempData來接收templateProduct的資料,並用tempData渲染資料

  useEffect(() => {
    setTempData(templateProduct);
  },[templateProduct])

  const handleModalInputChange = (e) => {
    const {name,value,checked,type} = e.target
    const val = type === 'checkbox' ? checked : value;
    setTempData((preData) => ({
      ...preData,
      [name]: val,
    }))
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    })
  }

  const handleModalImageChange = (index,value) => {
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl]; // [...pre.imagesUrl] 解構取得原本的img陣列
      newImage[index] = value

      //因為是新增，所以要 不等於 空值 時 // 正在輸入的是最後一筆 // 最多五筆
      if(value !== '' && index === newImage.length-1 && newImage.length < 5) {
        newImage.push('') // 在陣列最後新增一個空字串
      }

      if(value === '' && newImage.length > 1 && newImage[newImage.length-1] === '') {
        newImage.pop() // 移除陣列最後一個元素
      }

      return{
        ...pre,
        imagesUrl: newImage,
      }
    })
  }

  //優化使用者體驗：新增照片欄位
  const handleAddImage = () => {  
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.push('') // 在陣列最後新增一個空字串
      return{
        ...pre,
        imagesUrl: newImage,
      }
    })
  }
  
  //優化使用者體驗：刪除照片欄位  
  const handleARemoveImage = () => {
    setTempData((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop() // 移除陣列最後一個元素
      return{
        ...pre,
        imagesUrl: newImage,
      }
    })
  }

  //更新與新增產品api
  const updateProduct = async (id) => {  //差別在id,所以（）寫id做傳入
    // 先驗證必填欄位
    if (!validateAll()) return;

    let url =`${API_BASE}/api/${API_PATH}/admin/product`
    let method = 'post'

    if(modalType === 'edit'){
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`
      method = 'put'
    }

    const productData = {
      data:{
        ...tempData,
        origin_price: Number(tempData.origin_price), //做型態轉換
        price: Number(tempData.price), //做型態轉換
        is_enabled: tempData.is_enabled ? 1 : 0, //true回傳１,false回傳0
        imagesUrl:[...tempData.imagesUrl.filter(url => url !== "")], //防呆用
      }
    }

    try {
      const response = await axios[method](url, productData); //小技巧 []裡面放上面設定的變數method,這樣就可以共用了
      alert(`${response.data.message}，${tempData.title}`);
      getProducts();
      closeModal();
    } catch (error) {

    }

  }

  //刪除產品api
  const delProduct = async (id) => {
    try {
      const response = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`);
      alert(`${response.data.message}，${templateProduct.title}`);
      // console.log(response.data);
      getProducts();
      closeModal();
    } catch (error) {
      // console.log(error.response);
    }
  }

  //上傳圖片api
  const uploadImage = async (e) => {
    const file = e.target.files?.[0]
    if(!file) { //防呆提示
      return
    }

    try {
      const formData = new FormData()
      formData.append('file-to-upload', file)

      const response = await axios.post(`${API_BASE}/api/${API_PATH}/admin/upload`, formData) 
      setTempData((pre)=>({
        ...pre,
        imageUrl: response.data.imageUrl,
      }));
    } catch (error) {
      
    }
  }

    return(
      <div className="modal fade" id="productModal" tabIndex="-1" aria-labelledby="productModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-xl">
          <div className="modal-content border-0">
            <div className={`modal-header bg-${modalType === 'delete' ? 'danger' : modalType === 'edit' ? 'success' : 'primary'} text-white`}>
              <h5 id="productModalLabel" className="modal-title">
                <span>{modalType === 'delete' ? '刪除' : modalType === 'edit' ? '編輯' : '新增'}產品</span>
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                ></button>
            </div>
            <div className="modal-body">
              {
                modalType === 'delete' ? (
                  <p className="fs-4">確定要刪除<span className="text-danger">{tempData.title}</span>嗎？</p>
                ) : (<div className="row">
                <div className="col-sm-4">
                  <div className="mb-2">
                    <div className="mb-3">
                      <label htmlFor="fileUpload" className="form-label">
                        上傳圖片
                      </label>
                      <input 
                        className="form-control" 
                        type="file" 
                        name="fileUpload" 
                        id="fileUpload" 
                        accept=".jpg,.jpeg,.png"//限制檔案類型
                        onChange={(e) => uploadImage(e)}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="imageUrl" className="form-label">
                        輸入圖片網址
                      </label>
                      <input
                        type="text"
                        id="imageUrl"
                        name="imageUrl"
                        className={`form-control ${errors.imageUrl ? 'is-invalid' : ''}`}
                        placeholder="請輸入圖片連結"
                        value={tempData.imageUrl}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      {errors.imageUrl && <div className="invalid-feedback">{errors.imageUrl}</div>}
                    </div>
                    {/* 確認圖片有值 */}
                    {
                      tempData.imageUrl && (
                        <img className="img-fluid" src={tempData.imageUrl} alt="主圖" />
                      )
                    }
                  </div>
                  <div>
                    {
                      tempData.imagesUrl.map((url, index) => (
                        <div key={index}> 
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`圖片網址${index + 1}`}
                            value={url}
                            onChange={(e) => handleModalImageChange(index, e.target.value)}
                          />
                          {
                            url && 
                            <img
                              className="img-fluid"
                              src={url}
                              alt={`副圖${index + 1}`}
                            />
                          }
                        </div>
                      )) 
                    }
                    {
                      tempData.imagesUrl.length < 5 && 
                      tempData.imagesUrl[tempData.imagesUrl.length - 1] !== "" &&
                      <button className="btn btn-outline-primary btn-sm d-block w-100" onClick={() => handleAddImage()}>新增圖片</button>
                    }
                  </div>
                  <div>
                    {
                      tempData.imagesUrl.length >= 1 &&
                      <button className="btn btn-outline-danger btn-sm d-block w-100 mt-3" onClick={() => handleARemoveImage()}>刪除圖片</button>
                    }
                  </div>
                </div>
                {/* 以下欄位為必填欄位（以紅星標示）--- 若未填寫，會在欄位下方顯示 inline 錯誤（Bootstrap 的 is-invalid/invalid-feedback） */}
                <div className="col-sm-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">標題 <span className="text-danger">*</span></label>
                    <input
                      name="title"
                      id="title"
                      type="text"
                      className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                      placeholder="請輸入標題"
                      value={tempData.title}
                      onChange={(e) => handleModalInputChange(e)}
                      disabled={modalType === 'edit'} //補充：鎖定標題不可更改（條件鎖定）
                      />
                    {errors.title && <div className="invalid-feedback">{errors.title}</div>}
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="category" className="form-label">分類 <span className="text-danger">*</span></label>
                      <input
                        name="category"
                        id="category"
                        type="text"
                        className={`form-control ${errors.category ? 'is-invalid' : ''}`}
                        placeholder="請輸入分類"
                        value={tempData.category}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      {errors.category && <div className="invalid-feedback">{errors.category}</div>}
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="unit" className="form-label">單位 <span className="text-danger">*</span></label>
                      <input
                        name="unit"
                        id="unit"
                        type="text"
                        className={`form-control ${errors.unit ? 'is-invalid' : ''}`}
                        placeholder="請輸入單位"
                        value={tempData.unit}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      {errors.unit && <div className="invalid-feedback">{errors.unit}</div>}
                    </div>
                  </div>

                  <div className="row">
                    <div className="mb-3 col-md-6">
                      <label htmlFor="origin_price" className="form-label">原價 <span className="text-danger">*</span></label>
                      <input
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        min="0"
                        className={`form-control ${errors.origin_price ? 'is-invalid' : ''}`}
                        placeholder="請輸入原價"
                        value={tempData.origin_price}
                        onChange={(e) => handleModalInputChange(e)} 
                        />
                      {errors.origin_price && <div className="invalid-feedback">{errors.origin_price}</div>}
                    </div>
                    <div className="mb-3 col-md-6">
                      <label htmlFor="price" className="form-label">售價 <span className="text-danger">*</span></label>
                      <input
                        name="price"
                        id="price"
                        type="number"
                        min="0"
                        className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                        placeholder="請輸入售價"
                        value={tempData.price}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      {errors.price && <div className="invalid-feedback">{errors.price}</div>}
                    </div>
                  </div>
                  <hr />

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">產品描述</label>
                    <textarea
                      name="description"
                      id="description"
                      className="form-control"
                      placeholder="請輸入產品描述"
                      value={tempData.description}
                      onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">說明內容</label>
                    <textarea
                      name="content"
                      id="content"
                      className="form-control"
                      placeholder="請輸入說明內容"
                      value={tempData.content}
                      onChange={(e) => handleModalInputChange(e)}
                      ></textarea>
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        name="is_enabled"
                        id="is_enabled"
                        className="form-check-input"
                        type="checkbox"
                        checked={tempData.is_enabled}
                        onChange={(e) => handleModalInputChange(e)}
                        />
                      <label className="form-check-label" htmlFor="is_enabled">
                        是否啟用
                      </label>
                    </div>
                  </div>
                </div>
              </div>)
              }
            </div>
            <div className="modal-footer">
              {
                modalType === 'delete' ? (
                  <button type="button" className="btn btn-danger" onClick={() => delProduct(tempData.id)}>刪除</button>) : (
                    <>
                    <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal" onClick={() => closeModal()}>取消</button>
                    <button type="button" className="btn btn-primary" onClick={() => updateProduct(tempData.id)}>確認</button>
                    </>
                  )
              }
            </div>
          </div>
        </div>
      </div>
    )
}

export default ProductModal;