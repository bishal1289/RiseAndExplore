import { useState, type FormEvent } from 'react';
import { UserPlus, Send } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { adminApi, useAdminMutation, useAdminQuery } from '../lib/hooks';
import type { AdminUser, Role } from '../lib/types';
import { ListSkeleton, PageTitle, StatusChip, TextInput } from '../components/ui';
import { useConfirm } from '../components/Confirm';
import { useAuth } from '../AuthContext';

export default function Users() {
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const { data: users = [], isLoading } = useAdminQuery<AdminUser[]>('/users');
  const [inviting, setInviting] = useState(false);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'editor' as Role });

  const sendInvite = useAdminMutation(() => adminApi.post('/users/invite', invite), {
    success: `Invitation sent to ${invite.email}`,
    invalidate: ['/users'],
    onSuccess: () => {
      setInviting(false);
      setInvite({ name: '', email: '', role: 'editor' });
    },
  });
  const update = useAdminMutation(({ id, ...body }: { id: string; role?: Role; active?: boolean }) => adminApi.put(`/users/${id}`, body), {
    success: 'User updated',
    invalidate: ['/users'],
  });
  const resend = useAdminMutation((id: string) => adminApi.post(`/users/${id}/resend-invite`), { success: 'Invitation sent again' });

  const onInvite = (e: FormEvent) => {
    e.preventDefault();
    sendInvite.mutate(undefined);
  };

  return (
    <>
      <PageTitle
        title="Users"
        intro="People who can sign in to this admin panel. Owners can do everything; Editors can manage content but not settings or users."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus className="h-5 w-5" aria-hidden /> Invite someone
          </Button>
        }
      />
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const isMe = u._id === me?._id;
            return (
              <li key={u._id} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-soft ring-1 ring-navy/5 sm:flex-row sm:items-center">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy font-bold text-white" aria-hidden>
                  {(u.name || u.email)[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-navy">{u.name || u.email}</span>
                    {isMe && <span className="text-xs text-muted">(you)</span>}
                    {u.pending && <StatusChip status="scheduled" label="Invite pending" />}
                    {!u.active && <StatusChip status="archived" label="Deactivated" />}
                  </div>
                  <div className="truncate text-sm text-muted">{u.email}</div>
                  {u.lastLoginAt && <div className="text-xs text-muted">Last signed in {new Date(u.lastLoginAt).toLocaleDateString()}</div>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="input h-10 w-auto"
                    aria-label={`Role for ${u.email}`}
                    value={u.role}
                    disabled={isMe}
                    onChange={(e) => update.mutate({ id: u._id, role: e.target.value as Role })}
                  >
                    <option value="owner">Owner</option>
                    <option value="editor">Editor</option>
                  </select>
                  {u.pending && (
                    <Button size="sm" variant="outline-navy" onClick={() => resend.mutate(u._id)}>
                      <Send className="h-4 w-4" aria-hidden /> Resend
                    </Button>
                  )}
                  {!isMe && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className={u.active ? '!text-red-700' : ''}
                      onClick={async () => {
                        if (!u.active || (await confirm({ title: `Deactivate ${u.name || u.email}?`, message: 'They won’t be able to sign in. You can reactivate them later.', danger: true, confirmLabel: 'Deactivate' }))) {
                          update.mutate({ id: u._id, active: !u.active });
                        }
                      }}
                    >
                      {u.active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite someone" size="sm">
        <form onSubmit={onInvite} className="space-y-4 px-5 pb-5">
          <TextInput label="Name" value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} />
          <TextInput label="Email" type="email" required value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <fieldset>
            <legend className="mb-2 text-sm font-semibold text-navy">Role</legend>
            {(
              [
                ['editor', 'Editor', 'Events, photos, homepage and messages'],
                ['owner', 'Owner', 'Everything, including settings and users'],
              ] as [Role, string, string][]
            ).map(([value, label, desc]) => (
              <label key={value} className="mb-2 flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 ring-navy/15 has-[:checked]:bg-card has-[:checked]:ring-navy">
                <input type="radio" name="role" className="mt-1 h-4 w-4 accent-primary" checked={invite.role === value} onChange={() => setInvite({ ...invite, role: value })} />
                <span>
                  <span className="block font-semibold text-navy">{label}</span>
                  <span className="text-sm text-muted">{desc}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" fullWidth disabled={sendInvite.isPending}>
            {sendInvite.isPending ? 'Sending…' : 'Send invitation'}
          </Button>
        </form>
      </Modal>
    </>
  );
}
