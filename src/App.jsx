import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import * as bootstrap from "bootstrap";

import "./assets/style.css";
import ProductModal from './components/ProductModal';
import Pagination from './components/Pagination';


const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

const INITIAL_TEMPLATE_DATA ={
  id: "",
  title: "",
  category: "",
  origin_price: "",
  price: "",
  unit: "",
  description: "",
  content: "",
  is_enabled: false,
  imageUrl: "",
  imagesUrl: [],
}

function App() {

  const [formData,setFormData] = useState({
    username:'',
    password:''
  });

  const [isAuth,setIsAuth] = useState(false);

  const [products,setProducts] = useState([]);
  const [templateProduct,setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType,setModalType] = useState('');
  const [pagination,setPagination] = useState({});

  const productModalRef = useRef(null);
  const [errors, setErrors] = useState({});

  // 檢查登入狀態（可被重複呼叫）
  // 說明：
  // - 用途：用來向後端確認目前的 token 是否有效（例如在頁面初次載入或剛取得 token 後），
  //   若有效會把 `isAuth` 設為 true，並回傳 true；否則設為 false 並回傳 false。
  // - 呼叫時機：組件 mount 時（作為雙重驗證）、以及登入成功拿到 token 後再次驗證。
  // - 回傳值：boolean，代表驗證是否通過（可用於決定是否載入需要授權的資料）。
  const checkLogin = async () => {
    try {
      await axios.post(`${API_BASE}/api/user/check`);
      setIsAuth(true);
      return true;
    } catch (error) {
      setIsAuth(false);
      return false;
    }
  }

  // 登出處理
  // - 清除本機 hexToken cookie（讓瀏覽器不再帶入舊的 token）
  // - 移除 axios 全域的 `Authorization` header（避免後續請求帶入失效的憑證）
  // - 將 `isAuth` 設為 false，關閉任何開啟的 modal，並重置 `templateProduct` 狀態
  const handleLogout = () => {
    document.cookie = 'hexToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    delete axios.defaults.headers.common['Authorization'];
    setIsAuth(false);
    try { productModalRef.current?.hide(); } catch (e) {}
    setTemplateProduct(INITIAL_TEMPLATE_DATA);
  }

  const handleInputChange = (e) => {
    const {name,value} = e.target
    setFormData((preData) => ({
      ...preData,
      [name]:value,
    }))
  }

  // ❌ 錯誤：直接修改 state 物件 // ⭕ 正確：用 setState 並回傳新物件 //用解構方式
  // 處理 modal 內欄位變動
  // 說明：
  // - 更新 `templateProduct` 的對應欄位值（不直接 mutate，而是回傳新物件）
  // - 若該欄位先前有驗證錯誤，則在使用者修改時移除該錯誤（即時清除錯誤提示）
  const handleModalInputChange = (e) => {
    const {name,value,checked,type} = e.target
    const val = type === 'checkbox' ? checked : value;
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: val,
    }))
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    })
  }

  // 欄位名稱對映，用於產生友善的錯誤訊息
  const fieldLabels = {
    title: '標題',
    category: '分類',
    unit: '單位',
    origin_price: '原價',
    price: '售價',
    imageUrl: '主圖',
  };

  // 驗證所有必填欄位
  // 說明：
  // - required 陣列定義哪些欄位為必填
  // - 若欄位為空（空字串 / null / undefined），則在 newErrors 中加入錯誤訊息
  // - 將 newErrors 設到 state（供 UI 顯示 is-invalid 與 invalid-feedback）
  // - 回傳 boolean（true 表示全部通過）
  const validateAll = () => {
    const required = ['title','category','unit','origin_price','price','imageUrl'];
    const newErrors = {};
    required.forEach((k) => {
      const v = templateProduct[k];
      if (v === '' || v === null || v === undefined) {
        newErrors[k] = `${fieldLabels[k]} 為必填`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleModalImageChange = (index,value) => {
    setTemplateProduct((pre) => {
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
    setTemplateProduct((pre) => {
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
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop() // 移除陣列最後一個元素
      return{
        ...pre,
        imagesUrl: newImage,
      }
    })
  }

  //取得產品列表api
  const getProducts = async (page =1) => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products?page=${page}`)
      setProducts(response.data.products)
      setPagination(response.data.pagination)
    } catch (error) {
      // console.log(error.response)
    }
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
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price), //做型態轉換
        price: Number(templateProduct.price), //做型態轉換
        is_enabled: templateProduct.is_enabled ? 1 : 0, //true回傳１,false回傳0
        imagesUrl:[...templateProduct.imagesUrl.filter(url => url !== "")], //防呆用
      }
    }

    try {
      const response = await axios[method](url, productData); //小技巧 []裡面放上面設定的變數method,這樣就可以共用了
      // console.log(response.data);
      alert(`${response.data.message}，${templateProduct.title}`);
      getProducts();
      closeModal();
    } catch (error) {
      // console.log(error.response);
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
      setTemplateProduct((pre)=>({
        ...pre,
        imageUrl: response.data.imageUrl,
      }));
    } catch (error) {
      
    }
  }

  //登入功能api
  const onSubmit = async (e) => {
    try {
      e.preventDefault();
      const response = await axios.post(`${API_BASE}/admin/signin`,formData)

      const {token, expired} = response.data
      document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
      axios.defaults.headers.common['Authorization'] = token;

      // 雙重驗證：拿到 token 後再呼叫 checkLogin 確認
      const ok = await checkLogin();
      if (ok) {
        getProducts();
        setIsAuth(true);
      } else {
        alert('登入失敗（驗證未通過），請重新登入');
        handleLogout();
      }
    } catch (error) {
      setIsAuth(false)
      alert('登入失敗\n請檢查信箱或密碼');
    }
  }
  
  //cookie 設定
  useEffect(() => {
    const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("hexToken="))
    ?.split("=")[1];
    if(token){
      axios.defaults.headers.common['Authorization'] = token;
    }

    productModalRef.current = new bootstrap.Modal('#productModal',{
      keyboard: false,
    })

    // 註冊 axios response 攔截器，統一處理 401（Token 過期）
    // 說明：
    // - 目的：集中處理所有 API 回應中的未授權狀況（HTTP 401），避免每個 API 重複檢查。
    // - 行為：當收到 401 時執行 `handleLogout()`（清除 cookie、移除 axios Authorization、更新 UI），
    //   並可提示使用者重新登入。
    // - 清理：在 useEffect 的 return 中 eject 攔截器，避免重複註冊。
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (error) => {
        if (error.response?.status === 401) {
          // token 可能已過期或無效，主動登出並提示使用者
          handleLogout();
          alert('請重新登入');
        }
        return Promise.reject(error);
      }
    );

    // 進入時檢查登入並取得資料（雙重驗證）
    (async () => {
      const ok = await checkLogin();
      if (ok) getProducts();
    })();

    return () => {
      axios.interceptors.response.eject(interceptor);
    }
  },[])
  
  // open modal
  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre,
      ...product,
    }));
    productModalRef.current.show();
  }
  // close modal
  const closeModal = () => {
    productModalRef.current.hide();
  }

  return (
    <>
    {!isAuth ? (<div className="container login">
        <h1 className='mb-3 text-secondary-emphasis'>請先登入</h1>
        <form className="form-floating" onSubmit={(e) => onSubmit(e)}>
          <div className="form-floating mb-3">
            <input type="email" className="form-control" name="username" placeholder="name@example.com" value={formData.username} onChange={(e) => handleInputChange(e)}/>
            <label htmlFor="username">Email address</label>
          </div>
          <div className="form-floating mb-3 outline-success">
            <input type="password" className="form-control" name="password" placeholder="Password" value={formData.password} onChange={(e) => handleInputChange(e)}/>
            <label htmlFor="password">Password</label>
          </div>
          <button type="submit" className="btn btn-outline-secondary w-100">登入</button>
        </form>
      </div>) :(
        <div className='container'>
          <h2 className='mt-5 mb-2'>產品列表</h2>
          <div className="text-end mt-4 me-5">
            <button
              type="button"
              className="btn btn-outline-primary mb-3"
              onClick={() => openModal("create", INITIAL_TEMPLATE_DATA)}>
              建立新的產品
            </button>
          </div>
          <table className="table">
                <thead>
                  <tr>
                    <th scope='col'>分類</th>
                    <th scope='col'>產品名稱</th>
                    <th scope='col'>原價</th>
                    <th scope='col'>售價</th>
                    <th scope='col'>是否啟用</th>
                    <th scope='col'>編輯</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.category}</td>
                      <td scope="row">{product.title}</td>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td className={`${product.is_enabled && 'text-primary'}`}>{product.is_enabled ? '啟用' : '未啟用'}</td>
                      <td>
                        <div className="btn-group" role="group" aria-label="Basic outlined example">
                          <button type="button" className="btn btn-outline-success btn-sm" onClick={() => openModal('edit',product)}>編輯</button>
                          <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => openModal('delete', product)}>刪除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
          </table>
          <Pagination pagination={pagination} onChangePage={getProducts}/>
        </div>
      )}

    <ProductModal 
      modalType={modalType} //名字可以改不同，但通常會取一樣的比較方便
      templateProduct={templateProduct}
      handleModalInputChange={handleModalInputChange}
      handleModalImageChange={handleModalImageChange}
      handleAddImage={handleAddImage}
      handleARemoveImage={handleARemoveImage}
      updateProduct={updateProduct}
      delProduct={delProduct}
      uploadImage={uploadImage}
      closeModal={closeModal}
      errors={errors}
    />
    </>
  );
} 

export default App;
