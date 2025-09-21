// Mock authentication - replace with your actual auth system (Stack Auth, etc.)
export type UserRole = "superadmin" | "owner" | "moderator" | "editor" | "shipper" | "viewer"

//export interface User {
//  id: string
//  name: string
//  email: string
//  role: UserRole
//}
//
//// Mock user for development - replace with actual auth
//export const getCurrentUser = async (): Promise<User | null> => {
//  // This would normally come from your auth system
//  return {
//    id: "user_1",
//    name: "Admin User",
//    email: "admin@example.com",
//    role: "superadmin",
//  }
//}

export const hasPermission = (userRole: UserRole, action: string, resource: string): boolean => {
  const permissions: Record<UserRole, string[]> = {
    superadmin: ["*"], // Full access
    owner: [
      "products:read",
      "products:write",
      "products:delete",
      "categories:read",
      "categories:write",
      //"categories:delete",
      "brands:read",
      "brands:write",
      //"brands:delete",
      "orders:read",
      "orders:write",
      //"orders:delete",
      //"slides:read",
      //"slides:write",
      //"slides:delete",
      "reviews:read",
      "reviews:write",
      "reviews:delete",
      "users:read",
      "addresses:read",
      "neighborhoods:read",
      "neighborhoods:write",
      "dashboard:read",
    ],
    editor: [
      "products:read",
      "products:write",
      "categories:read",
      "categories:write",
      "brands:read",
      "brands:write",
      "slides:read",
      "slides:write",
      "colors:read",
      "colors:write",
      "sizes:read",
      "sizes:write",
      "tags:read",
      "tags:write",
      "dashboard:read",
    ],
    moderator: ["reviews:read", "reviews:write", "products:read", "orders:read", "dashboard:read"],
    shipper: ["orders:read", "orders:write", "addresses:read", "neighborhoods:read", "dashboard:read"],
    viewer: [
      "products:read",
      "categories:read",
      "brands:read",
      "orders:read",
      "reviews:read",
      "users:read",
      "addresses:read",
      "neighborhoods:read",
      "dashboard:read",
    ],
  }

  const userPermissions = permissions[userRole] || []
  return userPermissions.includes("*") || userPermissions.includes(`${resource}:${action}`)
}
