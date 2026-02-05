import { useState, useEffect, useRef } from 'react';
import axios from "axios";
import * as bootstrap from "bootstrap";

import "./assets/style.css";
import ProductModal from './components/ProductModal';
import Pagination from './components/Pagination';
import Login from './views/Login.jsx';


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
  size:"",
}

function App() {

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

  //取得產品列表api
  const getProducts = async (page =1) => {
    try {
      const response = await axios.get(`${API_BASE}/api/${API_PATH}/admin/products?page=${page}`)
      setProducts(response.data.products)
      setPagination(response.data.pagination)
    } catch (error) {
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
      ...INITIAL_TEMPLATE_DATA, //1. 確保資料完整性：API 回傳的舊產品資料可能缺少新增的欄位 2. 提供安全的預設值：避免 undefined 造成的錯誤 3. 未來擴充性：新增表單欄位時不容易出錯
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
    {!isAuth ? (
      <Login getProducts={getProducts} setIsAuth={setIsAuth} />
    ) :(
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
      getProducts={getProducts}
      closeModal={closeModal}
      errors={errors}
    />
    </>
  );
} 

export default App;
