<?php

namespace App\Actions\Order;

use App\Enums\OrderStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Jobs\SendAdminNotification;
use App\Models\Order;
use DomainException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class ConfirmPayment
{
    /**
     * Buyer confirms payment for a PENDING order.
     * Transitions from PENDING to VERIFYING and optionally stores payment proof on the private disk.
     */
    public function handle(Order $order, ?UploadedFile $proof = null): Order
    {
        return DB::transaction(function () use ($order, $proof) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if ($order->payment_expires_at->isPast()) {
                throw new DomainException('Batas waktu pembayaran untuk pesanan ini telah kedaluwarsa.');
            }

            if (! $order->status->canTransitionTo(OrderStatus::VERIFYING)) {
                throw new InvalidStatusTransitionException($order->status->value, OrderStatus::VERIFYING->value);
            }

            $proofPath = null;
            if ($proof) {
                // Store on private disk (storage/app/private/proofs)
                $proofPath = $proof->store('proofs', 'private');
            }

            $from = $order->status;

            $updateData = [
                'status' => OrderStatus::VERIFYING,
            ];

            if ($proofPath) {
                $updateData['payment_proof_path'] = $proofPath;
            }

            $order->update($updateData);

            $order->events()->create([
                'from_status' => $from,
                'to_status' => OrderStatus::VERIFYING,
                'actor' => 'buyer',
                'note' => $proofPath ? 'Pembeli mengonfirmasi pembayaran dengan bukti transfer.' : 'Pembeli mengonfirmasi pembayaran.',
            ]);

            SendAdminNotification::dispatch('payment.confirmed', $order->id)->afterCommit();

            return $order->fresh();
        });
    }
}
