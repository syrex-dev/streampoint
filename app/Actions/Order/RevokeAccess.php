<?php

namespace App\Actions\Order;

use App\Enums\AccountStatus;
use App\Enums\OrderStatus;
use App\Exceptions\InvalidStatusTransitionException;
use App\Models\Order;
use App\Models\ProductAccount;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class RevokeAccess
{
    /**
     * Revoke buyer access to an order due to rule violations (e.g., unauthorized password change, multi-device login).
     * Transitions order to CANCELLED, records audit note, and detaches/releases account unit.
     */
    public function handle(Order $order, string $reason, bool $releaseStock = true, string $actor = 'admin:1'): Order
    {
        $reason = trim($reason);
        if (empty($reason)) {
            throw new InvalidArgumentException('Alasan pencabutan akses wajib diisi.');
        }

        return DB::transaction(function () use ($order, $reason, $releaseStock, $actor) {
            $order = Order::where('id', $order->id)->lockForUpdate()->firstOrFail();

            if (! $order->status->canTransitionTo(OrderStatus::CANCELLED)) {
                throw new InvalidStatusTransitionException($order->status->value, OrderStatus::CANCELLED->value);
            }

            $from = $order->status;
            $note = "Akses dicabut oleh admin karena pelanggaran: {$reason}";

            // Handle assigned account unit
            if ($order->account_id) {
                $account = ProductAccount::where('id', $order->account_id)->lockForUpdate()->first();
                if ($account) {
                    $account->update([
                        'status' => $releaseStock ? AccountStatus::AVAILABLE : AccountStatus::DISABLED,
                        'order_id' => null,
                        'rented_until' => null,
                        'note' => $account->note ? ($account->note . ' | ' . $note) : $note,
                    ]);
                }
            }

            // Update order: cancelled status with clear violation note, remove credentials from buyer
            $order->update([
                'status' => OrderStatus::CANCELLED,
                'status_note' => $note,
                'account_id' => null, // Detach account so buyer cannot view credentials anymore
            ]);

            // Audit event log
            $order->events()->create([
                'from_status' => $from,
                'to_status' => OrderStatus::CANCELLED,
                'actor' => $actor,
                'note' => $note,
            ]);

            return $order->fresh();
        });
    }
}

