import { api } from "./_generated/api"
import { Id } from "./_generated/dataModel"
import { httpAction } from "./_generated/server"

export const webhookHandler = httpAction(async (ctx, request) => {
  try {
    const webhookData = await request.json()
    console.log("Received webhook data:", webhookData)

    // Extract event type from the request (you might need to adjust this based on your webhook provider)
    // Common patterns: webhookData.type, webhookData.event, or from headers
    const eventType = webhookData.type || request.headers.get("x-event-type")

    if (!eventType) {
      console.error("No event type found in webhook data")
      return new Response("Missing event type", { status: 400 })
    }

    const userData = webhookData.data

    if (!userData) {
      console.error("No user data found in webhook")
      return new Response("Missing user data", { status: 400 })
    }

    // Extract user information from webhook data
    const userId = userData.id
    const name = userData.display_name || userData.name || "Unknown User"
    const email = userData.primary_email || userData.email

    // Determine user type from metadata (default to participant if not specified)
    const role = userData.client_read_only_metadata?.role || "participant"
    const userType =
      role === "organizer"
      ? "organizer"
      : role === "admin"
      ? "admin"
      : role === "validator"
      ? "validator"
      : "participant"

    console.log(`Processing ${eventType} for user:`, { userId, name, email, userType })

    // Handle different event types
    switch (eventType) {
      case "user.created":
        try {
          const newUserId = await ctx.runMutation(api.users.create, {
            userId,
            name,
            email,
            metadata: {
              clientReadOnlyMetadata: userData.client_read_only_metadata,
              serverMetadata: userData.server_metadata || null,
            },
          })
          console.log("User created successfully:", newUserId)
        } catch (error) {
          console.error("Error creating user:", error)
          // If user already exists, try to update instead
          if (
            typeof error === "object" &&
            error !== null &&
            "message" in error &&
            typeof (error as { message: unknown }).message === "string" &&
            ((error as { message: string }).message.includes("já existe"))
          ) {
            await ctx.runMutation(api.users.update, {
              id: "" as Id<"users_sync">, // Placeholder, will be ignored in mutation
              userId,
              name,
              email,
              metadata: {
                clientReadOnlyMetadata: userData.client_read_only_metadata,
                serverMetadata: userData.server_metadata || null,
              },
            })
            console.log("User updated instead of created")
          } else {
            throw error
          }
        }
        break

      case "user.updated":
        const updatedUserId = await ctx.runMutation(api.users.update, {
          id: "" as Id<"users_sync">, // Placeholder, will be ignored in mutation
          userId,
          name,
          email,
          metadata: {
            clientReadOnlyMetadata: userData.client_read_only_metadata,
            serverMetadata: userData.server_metadata || null,
          },
        })
        console.log("User updated successfully:", updatedUserId)
        break

      //case "user.deleted":
      //  const deletedUserId = await ctx.runMutation(api.users.delete, {
      //    userId,
      //  })
      //  console.log("User deleted successfully:", deletedUserId)
      //  break

      default:
        console.warn("Unhandled event type:", eventType)
        return new Response(`Unhandled event type: ${eventType}`, { status: 400 })
    }

    return new Response("Webhook processed successfully", { status: 200 })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return new Response("Internal server error", { status: 500 })
  }
})
