<script lang="ts">
  import { resolve } from '$app/paths';
  import { getAdminStats } from '$lib/functions/admin.remote';
  import { startOfDay, subWeeks, format } from 'date-fns';

  // datetime-local input format
  const INPUT_FMT = "yyyy-MM-dd'T'HH:mm";

  // String state bound to the inputs (datetime-local expects "YYYY-MM-DDTHH:mm")
  let from = $state(format(subWeeks(startOfDay(new Date()), 1), INPUT_FMT));
  let to = $state(format(startOfDay(new Date()), INPUT_FMT));

  // Async state: initial load uses top-level await, updates via $effect
  let adminStats = $derived(await getAdminStats({ from, to }));

  const totalUsers = $derived(adminStats.length);
  const totalProjects = $derived(adminStats.reduce((s, u) => s + u.projectCount, 0));
  const totalCostCents = $derived(adminStats.reduce((s, u) => s + u.totalCostCents, 0));

  function cents(c: number) {
    const dollars = c / 100;
    return `${c.toFixed(4)}¢  ($${dollars.toFixed(4)})`;
  }
</script>

<div style="font-family: monospace; padding: 2rem; max-width: 1200px; margin: 0 auto;">
  <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">Admin Dashboard</h1>

  <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
    <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #aaa;">
      From
      <input
        type="datetime-local"
        bind:value={from}
        style="background: #111; color: #eee; border: 1px solid #333; padding: 0.25rem 0.4rem; font-family: monospace; font-size: 0.8rem;"
      />
    </label>
    <label style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: #aaa;">
      To
      <input
        type="datetime-local"
        bind:value={to}
        style="background: #111; color: #eee; border: 1px solid #333; padding: 0.25rem 0.4rem; font-family: monospace; font-size: 0.8rem;"
      />
    </label>
  </div>

  <p style="color: #888; margin-bottom: 2rem; font-size: 0.875rem;">
    {totalUsers} users · {totalProjects} projects · {cents(totalCostCents)} total AI spend in range
  </p>

  {#if adminStats.length === 0}
    <p>No users found.</p>
  {:else}
    <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
      <thead>
        <tr style="text-align: left; border-bottom: 2px solid #333;">
          <th style="padding: 0.5rem 1rem 0.5rem 0;">#</th>
          <th style="padding: 0.5rem 1rem 0.5rem 0;">User</th>
          <th style="padding: 0.5rem 1rem 0.5rem 0;">Registered</th>
          <th style="padding: 0.5rem 1rem 0.5rem 0; text-align: right;">Projects</th>
          <th style="padding: 0.5rem 1rem 0.5rem 0; text-align: right;">AI spend</th>
          <th style="padding: 0.5rem 0;">Projects</th>
        </tr>
      </thead>
      <tbody>
        {#each adminStats as u, i (u.id)}
          <tr style="border-bottom: 1px solid #222; vertical-align: top;">
            <td style="padding: 0.75rem 1rem 0.75rem 0; color: #666;">{i + 1}</td>
            <td style="padding: 0.75rem 1rem 0.75rem 0;">
              <div style="font-weight: bold;">{u.name}</div>
              <div style="color: #888; font-size: 0.75rem;">{u.email}</div>
            </td>
            <td style="padding: 0.75rem 1rem 0.75rem 0; color: #aaa; white-space: nowrap;">
              {format(u.createdAt, 'yyyy-MM-dd HH:mm')}
            </td>
            <td style="padding: 0.75rem 1rem 0.75rem 0; text-align: right;">
              {u.projectCount}
            </td>
            <td style="padding: 0.75rem 1rem 0.75rem 0;">
              {#if u.models.length === 0}
                <span style="color: #555;">—</span>
              {:else}
                <div style="display: flex; flex-direction: column; gap: 0.15rem;">
                  {#each u.models as m (m.modelId)}
                    <div style="display: flex; gap: 0.5rem; align-items: baseline;">
                      <span style="color: #aaa; font-size: 0.7rem; flex: 1;">{m.modelId}</span>
                      <span style="color: #888; font-size: 0.7rem;">×{m.runs}</span>
                      <span
                        style="color: {m.costCents > 0 ? '#f90' : '#555'}; white-space: nowrap;"
                      >
                        {cents(m.costCents)}
                      </span>
                    </div>
                  {/each}
                  <div
                    style="border-top: 1px solid #333; margin-top: 0.15rem; padding-top: 0.15rem; display: flex; justify-content: flex-end; gap: 0.5rem;"
                  >
                    <span style="color: #888; font-size: 0.7rem;"
                      >total ×{u.models.reduce((s, m) => s + m.runs, 0)}</span
                    >
                    <span
                      style="color: {u.totalCostCents > 0 ? '#f90' : '#555'}; font-weight: bold;"
                    >
                      {cents(u.totalCostCents)}
                    </span>
                  </div>
                </div>
              {/if}
            </td>
            <td style="padding: 0.75rem 0;">
              {#if u.projects.length === 0}
                <span style="color: #555;">—</span>
              {:else}
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                  {#each u.projects as p (p.id)}
                    <a
                      href={resolve('/(app)/p/[id]', { id: p.id })}
                      style="color: {p.isPublic
                        ? '#6af'
                        : '#f86'}; text-decoration: none; display: flex; align-items: center; gap: 0.4rem;"
                    >
                      <span
                        style="font-size: 0.65rem; border: 1px solid; padding: 0 0.25rem; border-radius: 2px; opacity: 0.8;"
                        >{p.isPublic ? 'pub' : 'priv'}</span
                      >
                      <span
                        style="max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                        >{p.name}</span
                      >
                      <span style="color: #555; font-size: 0.7rem;">👁 {p.views}</span>
                    </a>
                  {/each}
                </div>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
