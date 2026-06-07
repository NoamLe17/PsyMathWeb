"use client";
import { PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonProps {
  amount: string;
  onSuccess: (details: any) => void;
}

export default function PayPalButton({ amount, onSuccess }: PayPalButtonProps) {
  return (
    <div className="w-full max-w-[300px]">
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect" }}
        createOrder={(data, actions) => {
          return actions.order.create({
              purchase_units: [
                  {
                      amount: {
                          value: amount,
                          currency_code: "ILS",
                      },
                  },
              ],
              intent: "CAPTURE"
          });
        }}
        onApprove={async (data, actions) => {
          if (actions.order) {
            try {
              const details = await actions.order.capture();
              onSuccess(details);
            } catch (captureError) {
              console.error("PayPal Capture Error:", captureError);
              alert("התשלום בוצע אך חלה שגיאה בעיבוד הנתונים. אנא פנה לתמיכה.");
            }
          }
        }}
        onCancel={(data) => {
          // תופס את סגירת החלון בצורה שקטה ומסודרת
          console.log("המשתמש סגר את חלון התשלום:", data);
          alert("תהליך התשלום בוטל.");
        }}
        onError={(err) => {
          console.error("PayPal Error:", err);
          alert("חלה שגיאה בתהליך התשלום. נסה שוב.");
        }}
      />
    </div>
  );
}