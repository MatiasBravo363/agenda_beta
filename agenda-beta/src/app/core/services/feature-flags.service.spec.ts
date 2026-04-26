import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { FeatureFlagsService, FeatureFlag } from './feature-flags.service';
import { SupabaseService } from '../supabase/supabase.service';

function fakeSupabase() {
  return {
    client: {
      from: () => ({
        select: () => Promise.resolve({ data: [] as FeatureFlag[], error: null }),
      }),
    },
  } as unknown as SupabaseService;
}

describe('FeatureFlagsService', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FeatureFlagsService,
        { provide: SupabaseService, useFactory: fakeSupabase },
      ],
    });
  });

  it('isEnabled devuelve false antes de cargar y para flags inexistentes', () => {
    const svc = TestBed.inject(FeatureFlagsService);
    expect(svc.isEnabled('inexistente')).toBe(false);
  });

  it('setForTesting permite stubear flags sin Supabase', () => {
    const svc = TestBed.inject(FeatureFlagsService);
    svc.setForTesting({
      ui_paginacion_visible: { key: 'ui_paginacion_visible', enabled: true, rollout_percent: 100, description: null },
      dashboard_v2: { key: 'dashboard_v2', enabled: false, rollout_percent: 0, description: null },
    });
    expect(svc.isEnabled('ui_paginacion_visible')).toBe(true);
    expect(svc.isEnabled('dashboard_v2')).toBe(false);
    expect(svc.isEnabled('otra')).toBe(false);
  });

  it('flags() expone los flags como array', () => {
    const svc = TestBed.inject(FeatureFlagsService);
    svc.setForTesting({
      a: { key: 'a', enabled: true, rollout_percent: 100, description: null },
      b: { key: 'b', enabled: false, rollout_percent: 0, description: null },
    });
    expect(svc.flags().map((f) => f.key).sort()).toEqual(['a', 'b']);
  });
});
