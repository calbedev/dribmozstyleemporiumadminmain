import { PermissionGuard } from "@/components/admin/permission-guard"
import { ReviewDetail } from "@/components/admin/reviews/review-detail"

interface ReviewDetailPageProps {
  params: {
    id: string
  }
}

export default function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  return (
    <PermissionGuard action="read" resource="reviews">
      <ReviewDetail reviewId={params.id} />
    </PermissionGuard>
  )
}
