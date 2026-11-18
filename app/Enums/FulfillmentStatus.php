<?php

namespace App\Enums;

enum FulfillmentStatus: string
{
    case AWAITING_ACTION = 'AWAITING_ACTION';
    case INVITE_SENT = 'INVITE_SENT';
    case ACTIVE = 'ACTIVE';
    case DELIVERED = 'DELIVERED';
    case DONE = 'DONE';
    case ENDED = 'ENDED';

    public function label(): string
    {
        return match ($this) {
            self::AWAITING_ACTION => 'Menunggu Tindakan',
            self::INVITE_SENT => 'Undangan Terkirim',
            self::ACTIVE => 'Aktif',
            self::DELIVERED => 'Terkirim',
            self::DONE => 'Selesai',
            self::ENDED => 'Berakhir',
        };
    }

    public function canTransitionTo(self $to, DeliveryType $type): bool
    {
        if ($this === $to) {
            // INVITE_SENT -> INVITE_SENT is allowed for resend
            return $type === DeliveryType::INVITE && $this === self::INVITE_SENT;
        }

        return match ($type) {
            DeliveryType::STOCK => false, // Set directly to DELIVERED upon approval
            DeliveryType::INVITE => match ($this) {
                self::AWAITING_ACTION => in_array($to, [self::INVITE_SENT, self::ENDED], true),
                self::INVITE_SENT => in_array($to, [self::ACTIVE, self::ENDED], true),
                self::ACTIVE => $to === self::ENDED,
                default => false,
            },
            DeliveryType::MANUAL => match ($this) {
                self::AWAITING_ACTION => in_array($to, [self::DONE, self::ENDED], true),
                default => false,
            },
        };
    }
}
