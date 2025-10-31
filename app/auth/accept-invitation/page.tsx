"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { InvitationService } from "@/lib/services/invitation-service"
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("Enlace de invitación inválido")
      return
    }

    handleInvitation()
  }, [token])

  const handleInvitation = async () => {
    try {
      // Get invitation details
      const invitation = await InvitationService.getInvitationByToken(token!)

      if (invitation.invitation_type !== "business_team") {
        throw new Error("Este enlace es solo para invitaciones de equipo")
      }

      const auth = getAuth()

      // Check if user is already logged in
      if (auth.currentUser) {
        // User is logged in - verify email matches
        if (auth.currentUser.email?.toLowerCase() !== invitation.invited_email.toLowerCase()) {
          throw new Error("Debes cerrar todas las sesiones abiertas en este ordenador para ingresar con el correo: " + invitation.invited_email)
        }

        // Accept invitation for existing user
        await InvitationService.acceptInvitation(token!, auth.currentUser.uid)

        setStatus("success")
        setMessage(`¡Bienvenido al equipo de ${invitation.business_name}!`)

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/business/dashboard")
        }, 2000)
        return
      }

      // User is not logged in - create account with invitation
      const tempPassword = generateSecurePassword()

      try {
        // Try to create new account
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          invitation.invited_email,
          tempPassword
        )

        // Create user document
        await setDoc(doc(db, "users", userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: invitation.invited_email,
          user_type: "business_team",
          first_name: "",
          first_last_name: "",
          status: "active",
          owned_businesses: [invitation.business_id],
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        })

        // Accept invitation
        await InvitationService.acceptInvitation(token!, userCredential.user.uid)

        setStatus("success")
        setMessage(`¡Cuenta creada! Bienvenido al equipo de ${invitation.business_name}`)

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/business/dashboard")
        }, 2000)
      } catch (authError: any) {
        if (authError.code === "auth/email-already-in-use") {
          // User exists but not logged in - show login prompt
          setStatus("error")
          setMessage(
            `Ya tienes una cuenta con ${invitation.invited_email}. Por favor inicia sesión para aceptar la invitación.`
          )

          // Redirect to login with invitation token
          setTimeout(() => {
            router.push('/')
          }, 3000)
        } else {
          throw authError
        }
      }
    } catch (error: any) {
      console.error("Error accepting invitation:", error)
      setStatus("error")
      setMessage(error.message || "Error al procesar la invitación")
    }
  }

  const generateSecurePassword = () => {
    // Generate a random secure password (user will be prompted to change it)
    return Math.random().toString(36).slice(-16) + Math.random().toString(36).slice(-16)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {status === "loading" && "Procesando invitación..."}
            {status === "success" && "¡Invitación Aceptada!"}
            {status === "error" && "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-center text-muted-foreground">
                  Estamos configurando tu acceso al equipo...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <p className="text-center text-lg font-medium">{message}</p>
                <p className="text-center text-sm text-muted-foreground">
                  Serás redirigido al dashboard en unos segundos...
                </p>
              </>
            )}

            {status === "error" && (
              <>
                <div className="rounded-full bg-red-100 p-3">
                  <AlertCircle className="h-12 w-12 text-red-600" />
                </div>
                <p className="text-center text-lg font-medium">{message}</p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
