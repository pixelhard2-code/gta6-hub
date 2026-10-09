import { NextResponse } from "next/server";
import { db } from "@/app/lib/firebase"; 
import { doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Verificamos si la orden viene con el status "success" desde tu página
    if (body.status === "success") {
      const payload = body.payload;
      const userId = payload.userId;
      const ticketsCount = Number(payload.tickets);

      if (userId) {
        const userRef = doc(db, "users", userId);
        
        // Consultamos Firebase para ver si el usuario ya tiene un documento
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          // Si ya existe, simplemente le sumamos los tickets a los que ya tenía
          await updateDoc(userRef, {
            tickets: increment(ticketsCount),
          });
        } else {
          // Si es un usuario nuevo, le creamos su documento con los tickets iniciales
          await setDoc(userRef, {
            tickets: ticketsCount,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    return NextResponse.json({ message: "Tickets entregados con éxito" }, { status: 200 });
  } catch (error) {
    console.error("Error al procesar los tickets en Firebase:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}