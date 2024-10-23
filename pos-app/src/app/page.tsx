"use client";

import { useState, useEffect, useRef } from 'react';
import Quagga from 'quagga';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Product {
  id: number;
  code: string;
  name: string;
  price: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [message, setMessage] = useState('');
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // バックエンドから商品データを取得する処理
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/products/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setMessage("Failed to fetch products.");
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (scanning && scannerRef.current) {
      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            facingMode: 'environment' // リアカメラを使用
          }
        },
        decoder: {
          readers: ['ean_reader', 'upc_reader', 'code_128_reader'] // 必要なフォーマットを追加
        },
        locator: {
          patchSize: 'large', // パッチサイズを調整
          halfSample: false
        },
        locate: true,
        numOfWorkers: 4,
        frequency: 10
      }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        const code = result.codeResult.code;
        if (code) {
          setProductCode(code);
          setScanning(false);
          Quagga.stop();
        }
      });
    }

    return () => {
      if (scanning) {
        Quagga.stop();
      }
    };
  }, [scanning]);

  const handleLoadProduct = () => {
    const product = products.find(p => p.code === productCode);
    if (product) {
      setProductName(product.name);
      setProductPrice(product.price);
    } else {
      alert('商品マスタ未登録です');
      setProductName('');
      setProductPrice(0);
    }
  };

  const handleAddToCart = () => {
    const product = products.find(p => p.code === productCode);
    if (product && quantity > 0) {
      const existingItem = cart.find(item => item.product.id === product.id);
      if (existingItem) {
        existingItem.quantity += quantity;
        setCart([...cart]);
      } else {
        setCart([...cart, { product, quantity }]);
      }
      setProductCode('');
      setProductName('');
      setProductPrice(0);
      setQuantity(0);
    }
  };

  const handlePurchase = async () => {
    const totalAmount = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);

    const transaction = {
      datetime: new Date().toISOString(),
      emp_code: 'EMP001',
      store_code: 'STR001',
      pos_no: 'POS001',
      total_amt: totalAmount,
      details: cart.map(item => ({
        product_code: item.product.code,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity
      }))
    };

    try {
      const response = await fetch('http://127.0.0.1:8000/checkout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      if (response.ok) {
        toast.success('購入ありがとうございます！');
        setCart([]);
      } else {
        setMessage('Failed to complete purchase.');
      }
    } catch (error) {
      console.error("Failed to complete purchase:", error);
      setMessage("Failed to complete purchase.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP').format(amount);
  };

  const totalExcludingTax: number = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const totalIncludingTax: number = Math.round(totalExcludingTax * 1.1); // 10%の消費税を追加

  const handleScanStart = () => {
    setScanning(true);
  };

  const handleScanStop = () => {
    setScanning(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 p-8">
      <ToastContainer />
      <h1 className="text-4xl font-bold text-center mb-8">POS</h1>
      <div className="flex flex-col md:flex-row justify-between gap-8">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto w-full">
          <div className="mb-4">
            <input
              type="text"
              placeholder="商品コード"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleLoadProduct}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              商品コード読み込み
            </button>
          </div>
          <div className="mb-4">
            <button
              onClick={scanning ? handleScanStop : handleScanStart}
              className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              {scanning ? "カメラを停止" : "バーコードをスキャン"}
            </button>
            {scanning && <div ref={scannerRef} className="w-full h-64" />}
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="商品名"
              value={productName}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-200"
            />
          </div>
          <div className="mb-4">
            <input
              type="text"
              placeholder="単価"
              value={productPrice ? `${formatCurrency(productPrice)}円` : ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-200"
            />
          </div>
          <div className="mb-4">
            <input
              type="number"
              min="0"
              placeholder="数量"
              value={quantity.toString()}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleAddToCart}
              className="w-full mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
            >
              カートへ追加
            </button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold text-center mb-4">購入リスト</h2>
          <ul className="mb-4">
            {cart.map(item => (
              <li key={item.product.id} className="mb-2">
                {item.product.name} - {item.quantity} x {formatCurrency(item.product.price)} = {formatCurrency(item.quantity * item.product.price)}円
              </li>
            ))}
          </ul>
          <h3 className="text-xl font-bold">合計金額（税抜）: {formatCurrency(totalExcludingTax)}円</h3>
          <h3 className="text-xl font-bold">合計金額（税込）: {formatCurrency(totalIncludingTax)}円</h3>
          <button
            onClick={handlePurchase}
            className="w-full mt-4 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            購入
          </button>
        </div>
      </div>
    </div>
  );
}