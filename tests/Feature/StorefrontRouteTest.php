<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_with_quota_snapshot_and_store_name(): void
    {
        $response = $this->get('/');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->has('storeName')
            ->has('quota', fn (Assert $quota) => $quota
                ->has('limit')
                ->has('used')
                ->has('remaining')
                ->has('is_full')
                ->has('resets_at')
            )
        );
    }
}
