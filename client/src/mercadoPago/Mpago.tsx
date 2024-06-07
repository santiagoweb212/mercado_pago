import { useEffect, useState } from "react";
import { initMercadoPago, Wallet } from "@mercadopago/sdk-react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';
const Mpago = () => {
  const [preferenceId, setPreferenceId] = useState(null);
  const handleBuy = async () => {
    try {
      const preference = {
        items: [
          {
            id: "123",
            title: "Libro",
            description: "Libro de programacion",
            quantity: 1,
            currency_id: "PEN",
            unit_price: 2000,
          },
        ],
      };
      const result = await axios.post(
        "http://localhost:3500/create-preference",
        preference,{
          headers: {
            "Content-Type": "application/json",
            "X-Idempotency-Key": uuidv4(),
          }
        }
      );
      if (result.data.id) {
        setPreferenceId(result.data.id);
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    initMercadoPago("TEST-900fd8c7-281a-465f-8d5e-b8634527c874", {
      locale: "es-PE",
    });
  }, []);

  return (
    <div>
      <button onClick={handleBuy}>comprar</button>

      {preferenceId && (
        <Wallet initialization={{ preferenceId: preferenceId }} />
      )}
    </div>
  );
};
export default Mpago;
