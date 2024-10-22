"use client";

import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';
import axios from 'axios';

export default function Home() {
  const [barcode, setBarcode] = useState('');
  const [product, setProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);

  useEffect(() => {
    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      decoder: {
        readers: ["code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader", "code_39_vin_reader", "codabar_reader", "upc_reader", "upc_e_reader"]
      }
    }, (err) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log("Initialization finished. Ready to start");
      Quagga.start();
    });

    Quagga.onDetected(handleDetected);

    return () => {
      Quagga.offDetected(handleDetected);
      Quagga.stop();
    };
  }, []);

  const handleDetected = (result) => {
    const code = result.codeResult.code;
    setBarcode(code);
    fetchProduct(code);
  };

  const fetchProduct = async (code) => {
    try {
      const response = await axios.get(`http://localhost:8000/product?barcode=${code}`);
      setProduct(response.data);
      setError('');
    } catch (error) {
      console.error("Error fetching product:", error);
      setError('商品が見つかりませんでした');
      setProduct(null);
    }
  };

  const addToCart = () => {
    if (product) {
      setCart([...cart, product]);
      setTotal(total + product.price);
      setProduct(null);
      setBarcode('');
      setError('');
    }
  };

  const checkout = async () => {
    try {
      const response = await axios.post('http://localhost:8000/checkout', { cart });
      alert(`合計金額（税込）: ${response.data.total}, 合計金額（税抜）: ${response.data.totalExcludingTax}`);
      setCart([]);
      setTotal(0);
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  return (
    <div>
      <h1>POS System</h1>
      <div ref={scannerRef} style={{ width: '100%' }}></div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {product && (
        <div>
          <h2>{product.name}</h2>
          <p>価格: {product.price}円</p>
          <button onClick={addToCart}>カートに追加</button>
        </div>
      )}
      <h2>カート</h2>
      <ul>
        {cart.map((item, index) => (
          <li key={index}>{item.name} - {item.price}円</li>
        ))}
      </ul>
      <h3>合計: {total}円</h3>
      <button onClick={checkout}>購入</button>
    </div>
  );
}
