// 頁面元件通常放在 src/views 目錄下
import { useState, useEffect, useRef } from 'react';
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;
const API_PATH = import.meta.env.VITE_API_PATH;

function Login({getProducts,setIsAuth}) {
    const [formData,setFormData] = useState({
            username:'',
            password:''
        });
    
    const handleInputChange = (e) => {
        const {name,value} = e.target
        setFormData((preData) => ({
        ...preData,
        [name]:value,
        }))
    }

      //登入功能api
    const onSubmit = async (e) => {
        try {
        e.preventDefault();
        const response = await axios.post(`${API_BASE}/admin/signin`,formData)

        const {token, expired} = response.data
        document.cookie = `hexToken=${token};expires=${new Date(expired)};`;
        axios.defaults.headers.common['Authorization'] = token;

        getProducts();
        setIsAuth(true);
        } catch (error) {
            alert(error.response.data.message);
        }
    };

    return(
        <div className="container login">
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
        </div>        
    )
}

export default Login;